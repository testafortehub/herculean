#!/usr/bin/env python3
"""Test model loading outside Flask context."""
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import os
import sys

os.environ['HF_HUB_TIMEOUT'] = '300'
os.environ['TRANSFORMERS_CACHE'] = os.path.expanduser('~/.cache/huggingface')

print("Testing model loading...")
print(f"Python: {sys.version}")
print(f"Torch: {torch.__version__}")

# Test 1: Try to load GRPO v2 directly
try:
    print("\n[1] Attempting to load GRPO v2 as full model...")
    model = AutoModelForCausalLM.from_pretrained(
        "Wildstash/business-strategy-grpo-v2",
        device_map="auto",
        torch_dtype=torch.float16,
        trust_remote_code=True
    )
    print(f"✓ GRPO v2 model loaded: {type(model).__name__}")

    tokenizer = AutoTokenizer.from_pretrained(
        "Wildstash/business-strategy-grpo-v2",
        trust_remote_code=True
    )
    print(f"✓ GRPO v2 tokenizer loaded: {type(tokenizer).__name__}")
    print("SUCCESS: GRPO v2 loads correctly")

except Exception as e:
    print(f"✗ Failed to load GRPO v2: {e}")
    print(f"Error type: {type(e).__name__}")

    # Test 2: Try fallback
    try:
        print("\n[2] Attempting fallback to Qwen2.5-3B-Instruct...")
        model = AutoModelForCausalLM.from_pretrained(
            "Qwen/Qwen2.5-3B-Instruct",
            device_map="auto",
            torch_dtype=torch.float16
        )
        print(f"✓ Base model loaded: {type(model).__name__}")

        tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-3B-Instruct")
        print(f"✓ Base tokenizer loaded: {type(tokenizer).__name__}")
        print("SUCCESS: Fallback model loads correctly")

    except Exception as e2:
        print(f"✗ Failed to load fallback model: {e2}")
        print(f"Error type: {type(e2).__name__}")
