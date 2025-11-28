#!/usr/bin/env python3
import sys
import os
import io

old_stdout = sys.stdout
sys.stdout = io.StringIO()

import pymupdf4llm

sys.stdout = old_stdout

md_text = pymupdf4llm.to_markdown(sys.argv[1], show_progress=False)
print(md_text, end="")

