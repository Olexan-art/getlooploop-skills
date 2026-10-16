# Vectorscope reading: Large language model - Wikipedia

> Grouped by the agent's reading, not by embeddings: the fetch, extraction, chunking and the 26-passage cap are the product's exact rules; the groups are a judgement. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.

| | |
|---|---|
| URL | https://en.wikipedia.org/wiki/Large_language_model |
| Title | Large language model - Wikipedia |
| Words | 13,718 |
| Headings found | 17 |
| noindex | no |

**Pipeline:** Fetched → Extracted 13,718 words · 17 headings → Chunked 26 passages · 41,850 chars → Grouped 6 groups · 0 repeats (by reading; no embedding step)

## Counters

- **26** passages read
- **26/26** slots used of the 26-passage cap (every slot filled)
- **52,973** characters past the cap, not read. Zero unless every slot was filled; then counted as extracted characters minus indexed characters, and since passages overlap by about 200 characters and the first one repeats the title and description, it undercounts and can read 0 even when the cap cut off a tail.

## Checks

### AI crawlers and robots.txt

| Crawler | Vendor | What it does | This page | Deciding rule |
|---|---|---|---|---|
| OAI-SearchBot | OpenAI | assistant search index | allowed | no rule matches |
| ChatGPT-User | OpenAI | fetches when a user asks (vendor: robots.txt may not apply) | allowed | no rule matches |
| GPTBot | OpenAI | training data | allowed | no rule matches |
| Claude-SearchBot | Anthropic | assistant search index | allowed | no rule matches |
| Claude-User | Anthropic | fetches when a user asks | allowed | no rule matches |
| ClaudeBot | Anthropic | training data | allowed | no rule matches |
| PerplexityBot | Perplexity | assistant search index | allowed | no rule matches |
| Perplexity-User | Perplexity | fetches when a user asks (vendor: robots.txt may not apply) | allowed | no rule matches |
| Google-Extended | Google | training data | allowed | no rule matches |
| Googlebot | Google | web search index | allowed | no rule matches |
| Bingbot | Microsoft | web search index | allowed | no rule matches |
| CCBot | Common Crawl | training data | allowed | no rule matches |

### Technical markup

- **JSON-LD:** Article, ImageObject, Organization
- **Canonical:** https://en.wikipedia.org/wiki/Large_language_model (this page)
- **Meta description:** missing
- **With JavaScript:** 13,769 words, 26 passages (plain fetch: 13,718 words, 26 passages)

### Findings

- **[high] Text fell past the 26-passage cap** `cap_overflow` · passages #25  
  52,973 characters after passage #25 are never stored.  
  *What to do:* Move what matters earlier, cut repetition, or split the page so each part has its own 26 slots.
- **[medium] Passages that start mid-sentence** `mid_sentence_start` · passages #3 #4 #6 #10 #11 #13 #14 #15 #17 #19 #20 #22 #23 #25  
  14 passage(s) open on a lowercase word or a punctuation mark.  
  - #3 “used LSTM-based encoder-decoder architectures, as they preceded the invention o…”
  - #4 “impact work.[15] In 2024, OpenAI released the reasoning model OpenAI o1, which …”
  - #6 “a vocabulary of prescribed size is obtained. After a tokenizer is trained, any …”
  - #10 “edit ] Main article: Mixture of experts A mixture of experts (MoE) is a machine…”
  - #11 “simply truncates all the parameters to a given number of bits: this is applicab…”
  - #13 “authority than the user's input. This is called a "system prompt". [ citation n…”
  *What to do:* The section was longer than 2,000 characters and the window cut it. Break long sections with h2 headings so passages start where a topic starts.
- **[low] The same words in most groups** `repeated_claim` · passages #3 #7 #18  
  1 phrase(s) recur across at least half of the 6 groups.  
  - “the number of parameters (3 groups)”
  *What to do:* Repetition spends passages on what was already said and blurs the groups. Say it once, where it belongs.
- **[low] No meta description** `meta_description_missing` · passages #0  
  The intro passage (#0) has only the title and h1.  
  *What to do:* The chunker puts the description into passage #0. Write one or two sentences that say what the page answers.

## Rewrite plan

The agent's judgement, in priority order. Every passage must stand on its own, because a retriever sees it alone.

1. `cap_overflow` · passages #25  
   **Problem:** The article fills all 26 slots by the middle of "Evaluation"; about 53,000 characters, including Limitations and challenges, Safety and Societal concerns (copyright, energy demands), are never stored.  
   **Fix:** For a page this long the fix is structural: move the detail of the long middle sections into their "Main article" pages and keep a two-paragraph summary here, so the later sections fall inside the cap.
2. passages #2 #5 #9 #12 #18  
   **Problem:** Every section's text carries the "[ edit ]" link labels; they cost characters in every passage and make "edit" one of the page's top keywords.  
   **Fix:** Keep edit links out of the readable text (render them as icons with an aria-label, or outside the heading's text node), so the passage starts with the heading's subject.
   - *Before:* [ edit ] Scaling laws [ edit ] Main article: Neural scaling law
   - *After:* Scaling laws. Main article: Neural scaling law
3. passages #18 #20 #24  
   **Problem:** Formulas are extracted twice, as the rendered symbols and as their LaTeX source ("{\displaystyle C}"), so the passages on scaling and perplexity read as noise.  
   **Fix:** Expose one text form of each formula (the alt text or the MathML, not both), and state the formula's meaning in a sentence next to it.
   - *Before:* C {\displaystyle C} : cost of pretraining (the total amount of compute used)
   - *After:* C: the cost of pretraining a large language model, as the total amount of compute used
4. `mid_sentence_start` · passages #3 #4 #6  
   **Problem:** Sections such as History run over 2,000 characters under one h2 and are cut by the window, so passages open mid-sentence and lose their subject.  
   **Fix:** Promote the long sections' subsections to h2, or open each subsection with a sentence that names its subject, so a retriever never receives a passage that starts with a verb.
   - *Before:* used LSTM-based encoder-decoder architectures, as they preceded the invention of transformers.
   - *After:* Early neural machine translation used LSTM-based encoder-decoder architectures, because they preceded the invention of transformers.
5. `meta_description_missing` · passages #0  
   **Problem:** Passage #0 is the title twice and nothing else: the page has no meta description for the intro passage to carry.  
   **Fix:** Add a one-sentence description; the chunker puts it into passage #0.
   - *Before:* Large language model - Wikipedia Large language model
   - *After:* Large language model - Wikipedia. A large language model (LLM) is a neural network trained on a vast amount of text to generate, summarise, translate and analyse language.

## Query test

The agent's judgement: for each typical query, the best passage and whether it answers on its own.

| Query | Source | Best passage | Answer | Citable | The words that answer |
|---|---|---|---|---|---|
| what is a large language model | generated | #1 | complete | yes | “A large language model (LLM) is an AI model (typically a neural network) trained on a vast amount of text for natural language processing tasks, especially language generation.” |
| who introduced the transformer architecture | generated | #3 | complete | yes | “At the 2017 NeurIPS conference, Google researchers introduced the transformer architecture in their landmark paper "Attention Is All You Need".” |
| what is retrieval-augmented generation | generated | #13 | complete | yes | “Retrieval-augmented generation (RAG) is an approach that integrates LLMs with document retrieval systems.” |
| how much does it cost to train an LLM | generated | #7 | partial | yes | “the training of GPT-2 (i.e. a 1.5-billion-parameter model) in 2019 cost $50,000, while training of the PaLM (i.e. a 540-billion-parameter model) in 2022 cost $8 million” |
| what is chain-of-thought prompting | generated | #14 | complete | yes | “A 2022 paper demonstrated a separate technique called chain-of-thought prompting, which makes the LLM break the question down autonomously.” |
| how is a language model's performance measured | generated | #24 | complete | yes | “The canonical measure of the performance of any language model is its perplexity on a given text corpus.” |
| how much energy do LLMs use | generated | — | missing | no | — |
| can LLMs reproduce copyrighted text | generated | — | missing | no | — |

## The groups this page falls into

| Group | Label | Label source | Passages | Chars | Share |
|---|---|---|---|---|---|
| 0 | Definition and history of LLMs | heading: History | 5 | 6,382 | 15.2% |
| 1 | Tokenization, data cleaning and training | heading: Dataset preprocessing | 3 | 4,651 | 11.1% |
| 2 | Inference and architecture: attention, MoE, quantization | heading: Architecture | 4 | 5,063 | 12.1% |
| 3 | Prompting, RAG, tools, agents and modalities | heading: Extensibility | 6 | 11,580 | 27.7% |
| 4 | Scaling laws, emergence and evaluation | heading: Properties | 5 | 8,632 | 20.6% |
| 5 | Interpretability and whether LLMs understand | heading: Interpretation | 3 | 5,542 | 13.2% |

Label is the agent's name for the group when it gave one. Label source is the computed label: "heading" is the page's own section heading and can be quoted; "keywords" is the group's two most distinctive words, a hint and not what the section is called.

- **0 · Definition and history of LLMs:** The lede, then the timeline from early language models to open-weight reasoning models.
- **4 · Scaling laws, emergence and evaluation:** Measurement: what predicts performance and how it is scored.

## Passages, by group

In reading order inside each group. Each line shows how the passage opens (its first 240 characters).

### 0 · Definition and history of LLMs (5 passages)

- **#0** *Large language model - Wikipedia* · 53 chars  
  Large language model - Wikipedia Large language model
- **#1** 1,157 chars  
  Large language model From Wikipedia, the free encyclopedia Type of machine learning model "LLM" redirects here. For other uses, see LLM (disambiguation). The number of publications about large language models by year grouped by publication…
- **#2** *History* · 1,998 chars  
  [ edit ] The training compute of notable large models in FLOPs vs publication date over the period 2010–2024. For overall notable models (top left), frontier models (top right), top language models (bottom left) and top models within leadin…
- **#3** *History* · 1,994 chars  
  used LSTM-based encoder-decoder architectures, as they preceded the invention of transformers. An illustration of the main components of the transformer model from the original paper, where layers were normalized after (instead of before) m…
- **#4** *History* · 1,180 chars  
  impact work.[15] In 2024, OpenAI released the reasoning model OpenAI o1, which generates long chains of thought before returning a final answer.[19] Many LLMs with parameter counts comparable to those of OpenAI's GPT series have been develo…

### 1 · Tokenization, data cleaning and training (3 passages)

- **#5** *Dataset preprocessing* · 1,989 chars · **related link**  
  [ edit ] See also: List of datasets for machine-learning research § Internet Tokenization [ edit ] As machine learning algorithms process numbers rather than text, the text must be converted to numbers. In the first step, a vocabulary is de…
- **#6** *Dataset preprocessing* · 1,127 chars  
  a vocabulary of prescribed size is obtained. After a tokenizer is trained, any text can be tokenized by it, as long as it does not contain characters not appearing in the initial-set of uni-grams.[24] Dataset cleaning [ edit ] Main article:…
- **#7** *Training* · 1,535 chars · **related link**  
  [ edit ] See also: Fine-tuning (machine learning) and Post-training of large language models An LLM is a type of foundation model (large X model) trained on language. LLMs can be trained in different ways. In particular, GPT models are firs…

### 2 · Inference and architecture: attention, MoE, quantization (4 passages)

- **#8** *Inference* · 561 chars · **related link**  
  [ edit ] See also: Inference § Inference engines Inference is the process of providing input to a trained large language model and receiving generated output, such as text, images, code, or other files. Hosted inference runs a language mode…
- **#9** *Architecture* · 1,998 chars · **related link**  
  [ edit ] LLMs are generally based on the transformer architecture, which leverages an attention mechanism that enables the model to process relationships between all elements in a sequence simultaneously, regardless of their distance from e…
- **#10** *Architecture* · 1,995 chars · **related link**  
  edit ] Main article: Mixture of experts A mixture of experts (MoE) is a machine learning architecture in which multiple specialized neural networks ("experts") work together, with a gating mechanism that routes each input to the most approp…
- **#11** *Architecture* · 509 chars  
  simply truncates all the parameters to a given number of bits: this is applicable to static as well as dynamic quantization, but loses much precision. Dynamic quantization allows for the use of a different quantization codebook per layer, e…

### 3 · Prompting, RAG, tools, agents and modalities (6 passages)

- **#12** *Extensibility* · 1,997 chars  
  [ edit ] Beyond basic text generation, various techniques have been developed to extend LLM capabilities, including the use of external tools and data sources, improved reasoning on complex problems, and enhanced instruction-following or au…
- **#13** *Extensibility* · 1,992 chars · **related link**  
  authority than the user's input. This is called a "system prompt". [ citation needed ] Retrieval-augmented generation [ edit ] Retrieval-augmented generation (RAG) is an approach that integrates LLMs with document retrieval systems. Given a…
- **#14** *Extensibility* · 1,995 chars  
  input patterns are used to make the LLM plan actions and tool use is used to potentially carry out these actions.[54] In the DEPS ("describe, explain, plan and select") method, an LLM is first connected to the visual world via image descrip…
- **#15** *Extensibility* · 1,766 chars  
  an answer. The LLM mimics these examples and also tries to spend some time generating intermediate steps before providing the final answer. This additional step elicited by prompting improves the correctness of the LLM on relatively complex…
- **#16** *Forms of input and output* · 1,999 chars · **related link**  
  [ edit ] Multimodality [ edit ] See also: Multimodal learning Multimodality means having multiple modalities, where a "modality" refers to a type of input or output, such as video, image, audio, text, proprioception, etc.[69] For example, G…
- **#17** *Forms of input and output* · 1,831 chars  
  visual information into its pre-trained language model.[76] Non-natural languages [ edit ] LLMs can handle programming languages similarly to how they handle natural languages. No special change in token handling is needed as code, like hum…

### 4 · Scaling laws, emergence and evaluation (5 passages)

- **#18** *Properties* · 1,993 chars  
  [ edit ] Scaling laws [ edit ] Main article: Neural scaling law The performance of an LLM after pretraining largely depends on the: C {\displaystyle C} : cost of pretraining (the total amount of compute used), N {\displaystyle N} : size of…
- **#19** *Properties* · 1,997 chars  
  arcs. Performance of bigger models on various tasks, when plotted on a log–log scale, appears as a linear extrapolation of performance achieved by smaller models. However, this linearity may be punctuated by "break(s)"[86] in the scaling la…
- **#20** *Properties* · 654 chars  
  token}})} , then ( log ⁡ x , y ) {\displaystyle (\log x,y)} is an exponential curve (before it hits the plateau at one), which looks like emergence. When y = average log ⁡ ( Pr ( correct token ) ) {\displaystyle y={\text{average }}\log(\Pr(…
- **#24** *Evaluation* · 1,991 chars · **related link**  
  [ edit ] See also: LLM-as-a-Judge Perplexity [ edit ] The canonical measure of the performance of any language model is its perplexity on a given text corpus. Perplexity measures how well a model predicts the contents of a dataset; the high…
- **#25** *Evaluation* · 1,997 chars  
  to 43% of its size, beating PNG with 58%.[116] Benchmarks [ edit ] Main article: Language model benchmark Benchmarks are used to evaluate LLM performance on specific tasks. Tests evaluate capabilities such as general knowledge, bias, common…

### 5 · Interpretability and whether LLMs understand (3 passages)

- **#21** *Interpretation* · 1,997 chars · **related link**  
  [ edit ] Mechanistic interpretability [ edit ] Main article: Mechanistic interpretability Large language models are typically regarded as black boxes, and it is not clear how they perform linguistic tasks. Similarly, it is unclear if or how…
- **#22** *Interpretation* · 1,994 chars  
  say that a system that passes exams for software engineering candidates is not really intelligent?"[98] [99] Ilya Sutskever argues that predicting the next word sometimes involves reasoning and deep insights, for example if the LLM has to p…
- **#23** *Interpretation* · 1,551 chars  
  on the intelligence of LLMs suggests that our old ideas based on natural intelligence are inadequate".[97] Efforts to reduce or compensate for hallucinations have employed automated reasoning, retrieval-augmented generation (RAG), fine-tuni…

*Outside cap:* 52,973 characters at the end of the page fell past the cap. They are not passages of this reading: nothing there can be retrieved.

## Side-path content

9 passages look like related links or utility copy; they are still indexed.

- #5 · Dataset preprocessing · related link (group 1)
- #7 · Training · related link (group 1)
- #8 · Inference · related link (group 2)
- #9 · Architecture · related link (group 2)
- #10 · Architecture · related link (group 2)
- #13 · Extensibility · related link (group 3)
- #16 · Forms of input and output · related link (group 3)
- #21 · Interpretation · related link (group 5)
- #24 · Evaluation · related link (group 4)

## The words and phrases this page keeps using

Counted across the whole page, as single words and as the two-word phrases it writes often enough to be saying the phrase. A term reaching most groups describes the page; one confined to fewer is a section's own vocabulary. Group counts rest on the grouping above.

**Describes the page:** model (127; 6 of 6 groups), llm (102; 6 of 6 groups), token (44; 5 of 6 groups), edit (42; 6 of 6 groups), text (39; 6 of 6 groups), language (33; 6 of 6 groups), gpt (28; 6 of 6 groups), trained (25; 6 of 6 groups), input (24; 4 of 6 groups), training (22; 6 of 6 groups), example (20; 5 of 6 groups), based (19; 6 of 6 groups), dataset (19; 5 of 6 groups), step (19; 4 of 6 groups), task (18; 4 of 6 groups), data (17; 6 of 6 groups), performance (17; 5 of 6 groups), reasoning (16; 4 of 6 groups)

**Belongs to one section:** displaystyle (30; 2 of 6 groups), log (24; 1 of 6 groups)

---

A page contributes at most 26 passages, and this one filled every slot: 52,973 characters at the end of it are not indexed and cannot be retrieved to answer anything.

This is a preview of the machine's view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way.
