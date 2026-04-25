#!/usr/bin/env python3
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
from flask import Flask, request, jsonify
import logging
import os

os.environ['HF_HUB_TIMEOUT'] = '300'
os.environ['TRANSFORMERS_CACHE'] = os.path.expanduser('~/.cache/huggingface')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Lazy load model on first request
model = None
tokenizer = None
model_loaded = False

def load_model():
    global model, tokenizer, model_loaded
    if model_loaded:
        return

    logger.info("Loading GRPO v2 model...")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")

    if not torch.cuda.is_available():
        logger.warning("No CUDA device found - GRPO v2 requires GPU. Using distilgpt2 (CPU-optimized) instead.")
        try:
            model = AutoModelForCausalLM.from_pretrained("distilgpt2", torch_dtype=torch.float32)
            logger.info(f"✓ DistilGPT2 model loaded: {type(model).__name__}")
            tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
            logger.info(f"✓ DistilGPT2 tokenizer loaded: {type(tokenizer).__name__}")
        except Exception as e:
            logger.error(f"Failed to load distilgpt2: {e}", exc_info=True)
            model = None
            tokenizer = None
    else:
        try:
            logger.info("Attempting to load GRPO v2 as full model...")
            model = AutoModelForCausalLM.from_pretrained("Wildstash/business-strategy-grpo-v2", device_map=device, torch_dtype=torch.float32, trust_remote_code=True)
            logger.info(f"✓ GRPO v2 model loaded: {type(model).__name__}")
            tokenizer = AutoTokenizer.from_pretrained("Wildstash/business-strategy-grpo-v2", trust_remote_code=True)
            logger.info(f"✓ GRPO v2 tokenizer loaded: {type(tokenizer).__name__}")
        except Exception as e:
            logger.warning(f"Failed to load GRPO v2: {e}", exc_info=True)
            logger.info("Falling back to distilgpt2...")
            try:
                model = AutoModelForCausalLM.from_pretrained("distilgpt2", torch_dtype=torch.float32)
                logger.info(f"✓ DistilGPT2 model loaded: {type(model).__name__}")
                tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
                logger.info(f"✓ DistilGPT2 tokenizer loaded: {type(tokenizer).__name__}")
            except Exception as e2:
                logger.error(f"Failed to load distilgpt2: {e2}", exc_info=True)
                model = None
                tokenizer = None

    model_loaded = True
    logger.info(f"Final model state: {'LOADED' if model is not None else 'FAILED'}")

@app.route('/generate', methods=['POST'])
def generate():
    load_model()

    if not model or not tokenizer:
        return jsonify({"error": "Model failed to load"}), 500

    try:
        data = request.json
        prompt = data.get('prompt', '')
        max_tokens = data.get('max_tokens', 512)

        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400

        inputs = tokenizer(prompt, return_tensors="pt")
        outputs = model.generate(**inputs, max_new_tokens=max_tokens, do_sample=True, temperature=0.7)
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

        return jsonify({
            "prompt": prompt,
            "response": response_text,
            "tokens_generated": len(outputs[0])
        })
    except Exception as e:
        logger.error(f"Generation error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    logger.info(f"Health check: model_loaded={model_loaded}")
    return jsonify({"status": "ok", "model_loaded": model_loaded})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5555, debug=False)
