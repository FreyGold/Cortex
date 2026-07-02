# Section 4 — Presentation Script
# AI-Powered Academic Assistant & Intelligent Features
**Estimated time:** 12–14 minutes

---

## SLIDE 1 — Title
**Title:** AI in Cortex — Your Personal Academic Tutor  
**Subtitle:** Three AI layers that know your notes, think with you, and answer from your own study materials

**Speaker notes:**  
"In this section, I will present how Cortex integrates artificial intelligence — not as a gimmick, but as a deep architectural layer that connects to every part of the student's academic life. There are three different AI systems in Cortex, each serving a distinct purpose."

---

## SLIDE 2 — The AI Problem in Education
**Title:** Current AI Tools — Powerful but Disconnected from YOU

**Bullets:**
- ChatGPT answers from training data — not from YOUR notes
- Generic AI does not know your course, your professor, your textbook
- Copy-pasting between your notes and an AI chat is inefficient
- Students hallucinate AI answers into their notes without verification
- No AI tool is integrated into the study workflow itself

**Speaker notes:**  
"The problem with using ChatGPT for studying is that it does not know you. It does not know what you studied, what you understood, what you are confused about. Every session starts from zero. You cannot ask it 'based on my notes, explain what I am missing about CPU scheduling' — it has no access to your notes.

Cortex flips this. The AI in Cortex knows your study materials because it has read and indexed them. It answers from YOUR knowledge base, not from the internet."

---

## SLIDE 3 — Three AI Layers in Cortex
**Title:** AI That Meets You Where You Are

**Visual (three-layer diagram):**
```
┌─────────────────────────────────────────────┐
│ LAYER 1: EDITOR AI                          │
│ Write and edit inside your notes using AI   │
├─────────────────────────────────────────────┤
│ LAYER 2: NOTE TOOLS                         │
│ Summarize, get tag suggestions, embed notes  │
├─────────────────────────────────────────────┤
│ LAYER 3: LIBRARY ASSISTANT                  │
│ Ask questions — AI answers from YOUR notes  │
└─────────────────────────────────────────────┘
```

**Speaker notes:**  
"The three layers are: Editor AI, which lives inside the writing experience. Note Tools, which operate on individual notes in the sidebar. And the Library Assistant, which knows your entire note library and answers questions from it.

Let me walk through each one."

---

## SLIDE 4 — Layer 1: Editor AI — Write Smarter, Not Harder
**Title:** The AI Lives Inside the Editor

**Bullets:**
- Type `/ai` anywhere in a note → AI command panel opens
- Select text and press `Ctrl+J` → AI analyzes and acts on selection
- **Generate:** "Write an introduction to operating systems"
- **Edit:** "Make this explanation simpler"
- **Comment:** AI annotates your text with explanations
- Response streams word-by-word into the document in real-time
- Supports GPT-4, Gemini, Claude, Llama — you choose

**Speaker notes:**  
"Imagine writing a note on operating systems. You write a rough summary of how Round Robin scheduling works, but you are not happy with the explanation. You select it, press Ctrl+J, and type 'Simplify this using an analogy.' The AI reads your text, understands the context of your entire note, and rewrites that paragraph in a clearer way — streaming the new text character by character, right into your document. No copy-paste. No tab switching. The writing assistant is built into the editor.

The system also automatically classifies what you want. If you have no text selected and you give it a prompt, it knows you want to generate something new. If text is selected, it knows you want to edit or comment on it. This classification happens with a quick call to the AI before the main response."

---

## SLIDE 5 — Layer 2: Note AI Tools — Understand Your Notes
**Title:** Three Smart Tools in Every Note's Sidebar

**Visual (sidebar screenshot with AI tools section)**

**Bullets:**
- **Summarize:** Extract the 5 most important sentences — no API call needed, instant
- **Suggest Tags:** NLP analyzes content, suggests relevant labels (e.g., "scheduling", "process", "cpu")
- **Embed Note:** Converts the note into a mathematical vector for semantic search
- All three update the database directly — persistent results

**Speaker notes:**  
"In the note editor's sidebar, there is an AI Tools section with three buttons.

Summarize runs completely locally on our server — no external AI call. It uses a technique called extractive summarization: it scores each sentence in the note by how many important words it contains, then picks the top 5 sentences and presents them in reading order. This is instant and free.

Tag Suggestion similarly runs locally. It analyzes the word frequencies in your note, filters out common words, and suggests the most meaningful terms as tags. If your note is about CPU scheduling, it will suggest tags like 'scheduling', 'process', 'quantum', 'preemptive'. One click applies them.

The Embed button is more interesting — this calls Google Gemini's embedding API and converts your entire note into 768 numbers that represent its meaning mathematically. These numbers are stored in the database and power the Library Assistant."

---

## SLIDE 6 — What is a Text Embedding?
**Title:** Text Embeddings — How AI Understands Meaning

**Visual (2D diagram showing words in vector space):**
```
                    'CPU'
                      •
          'scheduling'•     •'algorithm'

          'Round Robin'•
                              •'process'
-------------------------------------------
'cooking'•
                              •'recipe'
        'kitchen'•
```

**Bullets:**
- Each word/document → a point in 768-dimensional space
- Similar meanings → points that are close together
- "CPU scheduling" and "process allocation" are CLOSE in this space
- "CPU scheduling" and "cooking recipes" are FAR APART
- This allows "search by meaning" instead of "search by keyword"

**Speaker notes:**  
"A text embedding is a way to convert any text — a word, a sentence, a whole note — into a list of 768 numbers. These numbers represent where that text lives in a mathematical space.

The key insight is that texts with similar meanings end up as points that are close together in this space. 'CPU scheduling' and 'process time-sharing' would be very close. 'CPU scheduling' and 'cooking pasta' would be very far apart.

When you ask the Library Assistant 'how does scheduling work?', it converts your question into the same 768-number format, then searches for your notes that are nearby in this mathematical space. It does not need to find the exact word 'scheduling' in your notes. If you called it 'process allocation' or 'time-slicing,' the similarity search would still find it."

---

## SLIDE 7 — Layer 3: The Library Assistant — RAG
**Title:** Ask Anything — Get Answers From YOUR Study Notes

**Visual (RAG pipeline diagram):**
```
Your Question
    ↓ (embed as vector)
Search 768-dim vector space
    ↓ (find top 5 most similar notes)
Your Most Relevant Notes
    ↓ (send notes + question to Gemini)
Grounded Answer + Source citations
```

**Bullets:**
- RAG = Retrieval-Augmented Generation
- Step 1: Convert your question to a vector (meaning)
- Step 2: Find the 5 most similar notes in your library
- Step 3: Send those notes + your question to Gemini
- Step 4: Gemini answers based ONLY on your notes
- Sources shown: "From: 'OS Lecture 3', 'Algorithm Notes'"

**Speaker notes:**  
"The Library Assistant uses a technique called RAG — Retrieval-Augmented Generation. The idea is: instead of asking the AI to answer from its training data, we first retrieve the most relevant content from the student's own library, then ask the AI to answer based on that content.

So when you ask 'What are the advantages of Round Robin scheduling?', the system: first converts your question into a vector, then finds the 5 notes in your library that are most similar to that question — perhaps your 'OS Lecture 3 notes' and your 'Algorithm comparison notes' — then sends those notes plus your question to Gemini, and instructs it: answer this question using only these notes. The result is an answer grounded in what YOU studied, with citations showing which of your notes it used.

This is fundamentally different from ChatGPT. ChatGPT might give you a correct but generic textbook answer. Cortex's Library Assistant will give you an answer based on your professor's specific way of explaining it, your personal understanding, your exact examples."

---

## SLIDE 8 — Why Google Gemini?
**Title:** Choosing the Right AI Model

**Comparison table:**
| | OpenAI GPT-4 | Google Gemini | Anthropic Claude |
|--|--|--|--|
| Arabic quality | Good | **Excellent** | Good |
| Cost/1M tokens | $10–30 | **$0.075** | $3–15 |
| Embedding quality | Good | **Excellent** | No embeddings |
| Context window | 128K | **1M** | 200K |
| Speed | Fast | **Fast** | Medium |

**Speaker notes:**  
"We evaluated three major AI providers. Gemini won on three critical dimensions.

First, Arabic language quality. We tested all three with academic Arabic text, and Gemini consistently produced better comprehension and generation quality for Arabic content — critical for Egyptian students who think and write in Arabic.

Second, cost. Gemini Flash costs $0.075 per million tokens. GPT-4 costs $10-$30 for the same amount. For a student-facing platform where we want to minimize costs, this is a 100-400x difference. The embedding model is even better — Gemini's text-embedding-004 is free to a generous limit.

Third, we needed a model that also supports embeddings. Anthropic does not offer embedding models. Google's text-embedding-004 produces 768-dimensional vectors that are well-suited for our semantic search use case."

---

## SLIDE 9 — Responsible AI Design
**Title:** Privacy-First AI — Your Notes Stay Yours

**Bullets:**
- Library Assistant ONLY reads notes belonging to the authenticated user
- Gemini receives your note text for inference — never stored by Google beyond their standard retention policy
- Summarization and tag suggestion run LOCALLY on our server — zero external calls
- AI answers are always grounded: no hallucination of content not in your notes
- Embeddings are stored in YOUR account in OUR database — not Google's

**Speaker notes:**  
"Privacy is a genuine concern with AI tools, and we took it seriously. The Library Assistant only searches notes that belong to you — the authenticated user. It never crosses user boundaries; even if two users study the same topic, their libraries are completely isolated.

For the note text that does go to Gemini — the summarization feature avoids this entirely by running locally. For the Library Assistant, note content is sent to Google's API. We inform users of this in the settings and plan to add an opt-in consent flow.

The most important privacy guarantee is architectural: answers are always grounded in retrieved content. The system instructs Gemini to answer ONLY from the provided notes, never from its training data alone. This reduces the risk of hallucination — the AI making up plausible-sounding but incorrect answers."

---

## SLIDE 10 — Demo Points
**Title:** What to Show

**Demo steps:**
1. Open a note with substantial content
2. Click "Summarize" in the sidebar → show the summary appearing instantly
3. Click "Suggest Tags" → show suggested tags, apply one
4. Type `/ai` in the editor → show the command panel
5. Type a prompt: "Add an example to this section" → watch streaming
6. Open "Ask Library" modal
7. Ask a question that relates to a note in the system: "What is Round Robin scheduling?"
8. Show the answer with source citations

---

## SLIDE 11 — Q&A Preparation

**Q: What if my notes have incorrect information? Will the AI spread errors?**  
A: Yes, the AI will answer based on your notes even if your notes are wrong. This is actually a feature of the RAG design — it reflects YOUR understanding, not a generic textbook. Students should review AI answers critically, just as they would review their own notes.

**Q: Does Gemini store our note content?**  
A: Google's API usage policies apply. Note content sent to the API may be retained for up to 30 days per their standard data retention policy. We do not send notes to Gemini unless you explicitly trigger an AI feature (the Library Assistant or editor AI). Summarization and tag suggestions run locally.

**Q: How fast is the semantic search?**  
A: The pgvector cosine search on 768-dim vectors is typically under 50ms even for thousands of notes, because Supabase creates an IVFFlat index that allows approximate nearest-neighbor search.

**Q: Can the AI learn from my corrections?**  
A: Not currently — the AI does not fine-tune on user feedback. This is a future enhancement where user corrections could improve the local extractive summarizer.

**Q: What happens if I have no notes? Can I still use the Library Assistant?**  
A: Yes — if no similar notes are found above the similarity threshold, the system falls back to a general Gemini answer and clearly labels it as a general response, not based on your library.
