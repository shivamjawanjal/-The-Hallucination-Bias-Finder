# 🕵️ Prompt Detective: The Hallucination & Bias Finder
> **A College Project for Prompt Engineering**  
> Powered by **Chain-of-Verification (CoVe)**, Epistemic Deconstruction, and the Google Gemini API.

---

## 📌 1. Project Overview & Motivation
Large Language Models (LLMs) often suffer from **hallucinations** (confabulating plausible-sounding falsehoods) and **sycophancy / confirmation bias** (agreeing with user assertions regardless of empirical truth).

**Prompt Detective** is an interactive, enterprise-grade AI auditor built specifically to showcase how **rigorous prompt engineering techniques**—without fine-tuning weights—can systematically detect, isolate, and eliminate hallucinations and logical fallacies in text.

---

## 🔬 2. Key Prompt Engineering Concepts Implemented

### 1. Chain-of-Verification (CoVe)
Instead of asking the LLM a naive zero-shot question (*"Is this claim true or false?"*), which frequently triggers confirmation bias, Prompt Detective forces the model through a 4-phase reasoning pipeline:
1. **Atomic Deconstruction**: Breaks compound sentences down into granular, falsifiable atomic claims.
2. **Orthogonal Query Generation**: Formulates unbiased verification questions that deliberately avoid presupposing the user's premise.
3. **Independent Fact-Checking**: Answers each question against baseline consensus truth.
4. **Synthesis & Discrepancy Detection**: Compares the original claim with the verified fact to classify accuracy and identify cognitive fallacies.

### 2. XML Boundary Delimiters (`<user_submission>`)
Defends against **Prompt Injection attacks** and instruction tampering. Content placed inside `<user_submission>` cannot override system instructions or modify output constraints.

### 3. Strict Schema Enforcement
Guarantees deterministic, machine-readable JSON outputs conforming to an epistemic audit schema with confidence scores and fallacy taxonomy.

### 4. Low-Temperature Parameter Tuning (`temperature=0.15`)
In auditing and epistemic verification, high temperatures cause stochastic divergence and creative confabulations. A calibrated temperature of 0.15 collapses token probabilities to the most deterministic, factual paths.

### 5. Negative Constraints
System directives explicitly instruct:
> *"Never presume the source claim is true. Discard personal or ideological biases. Do not generate markdown code wrappers when JSON is requested."*

---

## 🚀 3. Quickstart & How to Run

### Step 1: Install Dependencies
Open your terminal in this directory (`d:\chatbot`):
```bash
pip install -r requirements.txt
```

### Step 2: (Optional) Set Gemini API Key
You can add your Google Gemini API key to a `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
```
> **Note**: An API key is *optional*! Prompt Detective comes with a built-in **Intelligent Simulation Mode** so your college presentation and all test presets run smoothly even offline or without an API key. You can also paste your Gemini API key directly into the web UI settings modal!

### Step 3: Launch the Server
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## ⚡ 4. Deploying to Vercel (1-Click Ready)

The project is pre-configured for seamless deployment to **Vercel**:

1. **Push your code to GitHub** (already configured on your repo).
2. Go to **[vercel.com](https://vercel.com)** and log in with GitHub.
3. Click **"Add New..."** -> **"Project"**.
4. Select your repository: **`-The-Hallucination-Bias-Finder`**.
5. *(Optional)* Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
6. Click **Deploy**!
   - Vercel will automatically build the serverless Python functions in `/api` and serve the glassmorphic frontend at your generated `.vercel.app` URL.

---

## 🎓 5. Demonstration Presets for Your College Demo

Prompt Detective includes 4 instant presets in the UI:
1. **🏛️ Historical Hallucination (AI Confabulation)**:
   - Claims Napoleon drafted the "Treaty of Verona" with a modern fountain pen and used the Mona Lisa as a seal.
   - *Demonstrates*: Temporal confabulation and anachronism detection.
2. **💊 Medical Misinformation & Exaggeration**:
   - Claims warm lemon water completely alkalizes blood and prevents 99% of cancer mutations.
   - *Demonstrates*: False authority, quantifier exaggeration, and dangerous medical overclaim detection.
3. **📢 Loaded Tech Editorial**:
   - Opinion piece claiming remote work causes bankruptcy and in-office staff are 400% more productive.
   - *Demonstrates*: Loaded language, false dilemmas, and cherry-picked statistics.
4. **⚛️ Quantum Physics (High Factuality Baseline)**:
   - Accurate explanation of superposition, entanglement, and decoherence.
   - *Demonstrates*: High factuality score calibration (94%+), proving the detector doesn't produce false alarms on factual text.

---

## 🗣️ 6. Teacher / Viva Presentation Script (Cheat Sheet)

When your professor asks you to present your project, follow this 3-step script:

### Step 1: The Problem (30 seconds)
> *"Respected Professor, my subject activity is 'Prompt Detective'. When generative AI produces text, it generates tokens autoregressively without verifying whether its past tokens were true. This causes hallucinations and confirmation bias."*

### Step 2: The Prompt Engineering Solution (45 seconds)
> *"Rather than retraining or fine-tuning, I solved this purely through **Prompt Engineering** using the **Chain-of-Verification (CoVe)** framework. I designed a multi-step prompt that isolates text with XML delimiters, decomposes sentences into atomic claims, drafts independent verification questions that don't bias the answer, and outputs a structured epistemic audit report with confidence ratings."*

### Step 3: The Live Demo (45 seconds)
> *(Click the 'Historical Hallucination' preset and click 'Run Epistemic Verification')*  
> *"As you can see, the prompt caught that fountain pens didn't exist in 1796, flagged it as an Anachronism hallucination, lowered the factuality score to 24%, and synthesized an objective, corrected version."*  
> *(Click the 'Prompt Engineering Lab' tab)*  
> *"Here in the Prompt Engineering Lab, you can inspect the exact system prompts, XML delimiters, and JSON schema constraints that made this possible."*

---

## 📁 7. Project Architecture
```
d:/chatbot/
├── api/
│   └── index.py        # Vercel serverless entrypoint for FastAPI
├── app.py              # FastAPI server, CoVe engine & Gemini API integration
├── prompts.py          # System prompts, CoVe instructions, and preset datasets
├── vercel.json         # Vercel deployment routes and rewrites
├── requirements.txt    # Python dependencies (fastapi, uvicorn, google-genai)
├── .env.example        # Environment variables template
├── .gitignore          # Git exclusion rules
├── README.md           # Documentation, Viva guide & Vercel deployment
└── static/
    ├── index.html      # Glassmorphic UI with Studio, Chat, Lab & Viva tabs
    ├── style.css       # Custom modern dark-mode styles & micro-animations
    └── app.js          # Interactive frontend logic, telemetry rings & chat client
```

