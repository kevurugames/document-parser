package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func main() {
	http.HandleFunc("/convert", handleConvert)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "5002"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func handleConvert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Failed to read file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	switch ext {
	case ".pdf", ".docx":
	default:
		http.Error(w, "Unsupported file type. Only PDF and DOCX are supported.", http.StatusBadRequest)
		return
	}

	tmpFile, err := os.CreateTemp("", "upload-*"+ext)
	if err != nil {
		http.Error(w, "Failed to create temp file", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	if _, err := io.Copy(tmpFile, file); err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	var result []byte
	switch ext {
	case ".pdf":
		result, err = convertPDF(tmpFile.Name())
	case ".docx":
		result, err = convertDocx(tmpFile.Name())
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
	w.Write(result)
}

func convertPDF(path string) ([]byte, error) {
	pythonScript := `
import sys
import os
import io

old_stdout = sys.stdout
sys.stdout = io.StringIO()

import pymupdf4llm

sys.stdout = old_stdout

md_text = pymupdf4llm.to_markdown(sys.argv[1], show_progress=False)
print(md_text, end="")
`
	cmd := exec.Command("python3", "-c", pythonScript, path)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("PDF conversion failed: %s", stderr.String())
	}
	return stdout.Bytes(), nil
}

func convertDocx(path string) ([]byte, error) {
	pandocPath := os.Getenv("PANDOC_PATH")
	if pandocPath == "" {
		pandocPath = filepath.Join("pandoc-3.8.2.1-linux-amd64", "pandoc-3.8.2.1", "bin", "pandoc")
	}

	cmd := exec.Command(pandocPath, "-f", "docx", "-t", "gfm", path)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("DOCX conversion failed: %s", stderr.String())
	}
	return stdout.Bytes(), nil
}
