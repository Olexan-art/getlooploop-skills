# Vectorscope reading: Large language model - Wikipedia

> **Same for everyone.** The fetch, the text extraction, the cut (at h2 headings, then 2,000-character windows), the 26-passage cap, robots.txt and the automatic checks are scripts: identical whichever model runs the skill.
>
> **Your model's judgement.** The groups, their names, the rewrite plan, the query test and the facts are the reading of the model that ran this skill (model not stated by the agent). Another model may group a little differently. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.
>
> **Not any assistant's pipeline.** ChatGPT, Gemini, Perplexity, Copilot and others use their own crawlers, cuts and embeddings, and do not publish them. The principle is the same (fetch → text → passages → retrieval); the details differ. This reading is a working model of a typical retriever, not a copy of any one of them; the 26-passage cap is this tool's.
>
> **Three kinds of number.** Every section and number carries a marker: `measured` is what the parser saw, `derived` is computed from it by a fixed formula, `judgement` is the agent's reading. *How each number is computed*, at the end, gives every formula.

| | |
|---|---|
| URL | https://en.wikipedia.org/wiki/Large_language_model |
| Title | Large language model - Wikipedia |
| Words | 13,718 `measured` |
| Headings found | 17 `measured` |
| noindex | no |

**Pipeline:** Fetched → Extracted 13,718 words · 17 headings → Chunked 26 passages · 41,850 chars → Grouped 6 groups · 0 repeats (by reading; no embedding step)

## Counters `measured` `derived`

- **26** passages read `measured`
- **26/26** slots used of the 26-passage cap (every slot filled) `measured`
- **55,001** characters past the cap, not read `derived`: the kept text after the last passage, counted only when every slot is filled.
- **39,111** characters of unique text in passages `derived`
- **41,850** characters in passages, overlap and intro included `measured`
- The 2.101 estimate, `charsUnread` = 52,973, subtracted the overlapping total and undercounts; it stays in the export for compatibility.

## Where the text goes `measured` `derived`

Characters, whitespace runs folded to one space. "Text in the raw HTML" is the kept text plus every removal, so the stages sum exactly.

| Stage | Characters | Share | Layer |
|---|---|---|---|
| Text in the raw HTML (estimate) | 139,071 | 100% of raw | `derived` |
| Removed by the cleaner | 44,809 | 32.2% of raw | `measured` |
| Kept: the chunker's input | 94,262 | 67.8% of raw | `measured` |
| In passages, unique | 39,111 | 41.5% of kept | `derived` |
| Kept, in no passage text | 150 | 0.2% of kept | `derived` |
| Past the cap | 55,001 | 58.3% of kept | `derived` |

The passages hold 41,850 characters in all: 39,111 unique, plus 2,686 of overlap between neighbours and 53 of intro (title, h1, description) in passage #0. Of the kept text in no passage: 124 in h2 heading lines, 26 spaces between sections.

### What the cleaner removed `measured`

41 elements with text, 44,809 characters. By reason: script, style, noscript, template 28,933 (14) · head (title, meta) 34 (1) · [hidden] or aria-hidden 161 (11) · page header (site banner) 277 (1) · controls inside a kept header 652 (1) · navigation (nav, role=navigation) 14,208 (10) · footer 523 (1) · form, button, select, input 6 (1) · outside the chosen main region 15 (1).

| Reason | Element | Path | Chars | Its text begins |
|---|---|---|---|---|
| script, style, noscript, template | `script` | script | 8,187 | “(RLQ=window.RLQ\|\|[]).push(function(){mw.config.set({"wgHostname":"mw-web.eqiad.c…” |
| script, style, noscript, template | `script` | head > script | 6,252 | “(function(){var className="client-js vector-feature-language-in-header-enabled v…” |
| navigation (nav, role=navigation) | `div#mwDmY.navbox` | … > div#mw-content-text > div.mw-content-ltr > section#mwDlI > div#mwDmY.navbox | 4,118 | “v t e Artificial intelligence (AI) History timeline Glossary Lists Algorithms Co…” |
| script, style, noscript, template | `style` | … > div.mw-content-ltr > section#mwAQ > span#mwDQ > style | 3,237 | “.mw-parser-output .sidebar{width:22em;float:right;clear:right;margin:0.5em 0 1em…” |
| navigation (nav, role=navigation) | `div#mwDmI.navbox` | … > div#mw-content-text > div.mw-content-ltr > section#mwDlI > div#mwDmI.navbox | 3,042 | “v t e Large language models (LLMs) List of LLMs AI Companies Benchmarks List of…” |
| navigation (nav, role=navigation) | `table#mwDg.sidebar.sidebar-collapse` | … > div#mw-content-text > div.mw-content-ltr > section#mwAQ > table#mwDg.sidebar.sidebar-collapse | 2,515 | “Part of a series on Machine learning and data mining Paradigms Supervised learni…” |
| navigation (nav, role=navigation) | `div#mwDmQ.navbox` | … > div#mw-content-text > div.mw-content-ltr > section#mwDlI > div#mwDmQ.navbox | 2,444 | “v t e Natural language processing General terms AI-complete Bag-of-words n-gram…” |
| script, style, noscript, template | `style` | … > div.mw-content-ltr > section#mwAQ > span#mwDQ > style | 2,340 | “.mw-parser-output .hlist dl,.mw-parser-output .hlist ol,.mw-parser-output .hlist…” |
| script, style, noscript, template | `style` | … > section#mwDlI > div#mwDmE > span.mw-empty-elt > style | 2,158 | “.mw-parser-output .navbox{box-sizing:border-box;border:1px solid #a2a9b1;width:1…” |
| script, style, noscript, template | `style#mwBdQ` | … > ol#mwBcw > li#cite_note-few-shot-learners2-1 > span#mw-reference-text-cite_note-few-shot-learners2-1 > style#mwBdQ | 2,100 | “.mw-parser-output cite.citation{font-style:inherit;word-wrap:break-word}.mw-pars…” |
| navigation (nav, role=navigation) | `nav#mw-panel-toc.mw-table-of-contents-container.vector-toc-landmark` | … > div.mw-page-container-inner > div.vector-column-start > div.vector-sticky-pinned-container > nav#mw-panel-toc.mw-table-of-contents-container.vector-toc-land | 1,627 | “Contents move to sidebar hide (Top) 1 History 2 Dataset preprocessing Toggle Dat…” |
| script, style, noscript, template | `style` | … > div.mw-content-ltr > section#mwBcg > span#mwBck > style | 1,151 | “.mw-parser-output .reflist-columns-2{column-width:30em}.mw-parser-output .reflis…” |
| script, style, noscript, template | `style` | … > tr > td.sidebar-navbar > span.mw-empty-elt > style | 1,109 | “.mw-parser-output .navbar{display:inline;font-size:88%;font-weight:normal}.mw-pa…” |
| script, style, noscript, template | `script` | script | 867 | “{"@context":"https:\/\/schema.org","@type":"Article","name":"Large language mode…” |
| script, style, noscript, template | `style#mwBaE` | … > div#mw-content-text > div.mw-content-ltr > section#mwBaA > style#mwBaE | 783 | “.mw-parser-output .portalbox{padding:0;margin:0.5em 0;display:table;box-sizing:b…” |
| controls inside a kept header | `header.mw-body-header.vector-page-titlebar` | … > div.mw-page-container-inner > div.mw-content-container > main#content > header.mw-body-header.vector-page-titlebar | 652 | “Afrikaans Aragonés العربية Azərbaycanca Boarisch Беларуская भोजपुरी বাংলা Bosans…” |
| footer | `footer#footer.mw-footer` | div.mw-page-container > div.mw-page-container-inner > div.mw-footer-container > footer#footer.mw-footer | 523 | “This page was last edited on 15 October 2026, at 18:18 (UTC). Page was rendered…” |
| navigation (nav, role=navigation) | `nav.vector-page-tools-landmark` | … > div.vector-page-toolbar > div.vector-page-toolbar-container > div#right-navigation > nav.vector-page-tools-landmark | 314 | “Tools move to sidebar hide Actions Read Edit View history General What links her…” |
| script, style, noscript, template | `style` | … > div.mw-content-ltr > section#mwAQ > span#mwAw > style | 303 | “.mw-parser-output .hatnote{font-style:italic}.mw-parser-output div.hatnote{paddi…” |
| page header (site banner) | `header.vector-header.mw-header` | div.vector-header-container > header.vector-header.mw-header | 277 | “Main menu move to sidebar hide Navigation Main page Contents Current events Rand…” |

21 more elements, 810 characters, not listed here (export.json lists up to 200 and sums the rest).

299 more matched elements held no text.

### How much of each section reached a passage `derived`

| Section | Reached a passage | Of | Share |
|---|---|---|---|
| *Intro: title, h1, description* | 53 | 53 | 100% |
| *Before the first h2* | 1,157 | 1,157 | 100% |
| History | 4,782 | 4,782 | 100% |
| Dataset preprocessing | 2,931 | 2,931 | 100% |
| Training | 1,535 | 1,535 | 100% |
| Inference | 561 | 561 | 100% |
| Architecture | 4,109 | 4,109 | 100% |
| Extensibility | 7,169 | 7,169 | 100% |
| Forms of input and output | 3,636 | 3,636 | 100% |
| Properties | 4,273 | 4,273 | 100% |
| Interpretation | 5,157 | 5,157 | 100% |
| Evaluation | **3,801** | 4,952 | 76.8% |
| Limitations and challenges | **0** | 3,747 | 0% |
| Safety | **0** | 3,579 | 0% |
| Societal concerns | **0** | 6,122 | 0% |
| See also | **0** | 1,007 | 0% |
| References | **0** | 37,385 | 0% |
| Further reading | **0** | 1,917 | 0% |

## Checks `measured` `derived`

### AI crawlers and robots.txt `measured`

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

### Technical markup `measured`

- **JSON-LD:** Article, ImageObject, Organization
- **Canonical:** https://en.wikipedia.org/wiki/Large_language_model (this page)
- **Meta description:** missing

### Findings `derived`

- **[high] Text fell past the 26-passage cap** `cap_overflow` · passages #25  
  55,001 characters after passage #25 are never stored.  
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

## Rewrite plan `judgement`

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

## Query test `judgement`

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

## The groups this page falls into `judgement`

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

## Passages, by group `measured` `judgement`

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

*Outside cap:* 55,001 characters at the end of the page fell past the cap. They are not passages of this reading: nothing there can be retrieved.

## Side-path content `derived`

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

## The page's vocabulary `derived`

*What the page says, not search demand — for how people ask, use the query test or https://www.getlooploop.com/voicescope.*

### Phrases this page owns

Two to four words the page writes together, in at least two passages (or three times in one), never across punctuation or a stopword. Ranked by passages covered, then uses.

1. language model (23; 10 passages; 6 of 6 groups; describes the page)
2. fine tuned (11; 7 passages; 3 of 6 groups)
3. large language model (10; 6 passages; 4 of 6 groups; describes the page)
4. neural network (8; 5 passages; 4 of 6 groups; describes the page)
5. natural language (7; 5 passages; 4 of 6 groups; describes the page)
6. open weight (8; 4 passages; 3 of 6 groups)
7. fine tuning (7; 4 passages; 3 of 6 groups)
8. machine learning (6; 4 passages; 3 of 6 groups)
9. billion parameter (6; 4 passages; 4 of 6 groups; describes the page)
10. larger models (4; 4 passages; 3 of 6 groups)
11. final answer (4; 3 passages; 2 of 6 groups)
12. openai o1 (3; 3 passages; 2 of 6 groups)
13. follow instructions (3; 3 passages; 3 of 6 groups)
14. next word (3; 3 passages; 3 of 6 groups)
15. parameter count (3; 3 passages; 3 of 6 groups)

### Narrative words

Single words, counted only where no phrase above already used them. They say what the page talks about; they are rarely what anybody types or asks.

model (100; 21 passages; 6 of 6 groups; describes the page), llm (98; 21 passages; 6 of 6 groups; describes the page), token (38; 11 passages; 5 of 6 groups; describes the page), text (29; 13 passages; 6 of 6 groups; describes the page), gpt (28; 12 passages; 6 of 6 groups; describes the page), trained (27; 15 passages; 6 of 6 groups; describes the page), input (22; 9 passages; 4 of 6 groups; describes the page), training (22; 11 passages; 6 of 6 groups; describes the page), data (20; 11 passages; 6 of 6 groups; describes the page), dataset (19; 9 passages; 5 of 6 groups; describes the page)

---

A page contributes at most 26 passages, and this one filled every slot: 55,001 characters at the end of it are not indexed and cannot be retrieved to answer anything.

This is a preview of the machine's view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way.

## How each number is computed

- `measured` **Measured:** What the parser saw: words, passages, characters, robots.txt, markup. A script counted it; any model running the skill gets the same number.
- `derived` **Derived:** Computed from measured values by a fixed formula: shares, characters past the cap, check verdicts. Deterministic; where it rests on the agent's groups, the metric says so.
- `judgement` **Agent's judgement:** The agent's reading of the passages: groups, labels, the rewrite plan, the query test, the facts. The scripts validate its shape and quotes; another model may judge differently.

- **Words** `measured` (`words`). The extracted body text split on whitespace; every non-empty piece is a word. *Unit:* words. *Limits:* Counted after the cleaner, so menus, footers and hidden text are not in it. A page drawn by JavaScript reads low here; compare with --render.
- **Headings found** `measured` (`headings`). h1 elements plus h2 elements (the first 40) left after the cleaner, with empty ones dropped. *Unit:* headings. *Limits:* h3 and styled text are not counted: the chunker splits only at h2.
- **Passages read** `measured` (`passages`). Sections at h2 headings (or paragraph blocks), long ones cut into 2,000-character windows with about 200 characters of overlap, slivers under 40 characters folded into the passage before, then the first 26 kept. *Unit:* passages. *Threshold:* At most 26 per page (this tool's cap). *Limits:* Other systems cut and cap differently; this is a working model of a typical retriever.
- **Cap slots used** `measured` (`slots`). Passages kept, out of the 26-passage cap. "Every slot filled" when the chunker produced 26 or more. *Unit:* slots. *Threshold:* 26: a full cap means text may have been left out (see characters past the cap). *Limits:* A full cap does not by itself mean text was lost: the last passage may end exactly at the end of the page.
- **Passage length** `measured` (`passage_chars`). The length of one passage's text, as the chunker emitted it. *Unit:* characters, as the passage text holds them. *Threshold:* At most about 2,000, unless a sliver was folded in. *Limits:* Neighbouring passages share about 200 characters by design.
- **Text in passages, overlap and intro included** `measured` (`chars_in_passages`). The sum of every passage's length (page.charsIndexed). Passage #0 repeats the title, h1 and meta description; neighbours repeat about 200 characters. *Unit:* characters, as the passage text holds them. *Limits:* Counts repeated text more than once, so it can exceed the page's own text. For how much of the page reached a passage, read the unique number.
- **Unique text in passages** `derived` (`chars_unique`). Each passage is located in the kept text (the intro part, title, h1 and description, set aside); the union of the located spans is counted once, so overlap is not counted twice. *Unit:* characters, whitespace runs folded to one space. *Limits:* A passage the locator cannot place is reported as unlocated rather than guessed. Heading lines the chunker carries only as a passage's heading are not in it.
- **Characters past the cap** `derived` (`chars_past_cap`). Only when every one of the 26 slots is filled: the kept text after the end of the last passage. Equivalently, kept text − unique text in passages − text between passages, counted after the last one. *Unit:* characters, whitespace runs folded to one space. *Threshold:* Above 0 means a tail no retriever using this cap can return. *Limits:* Replaces the 2.101 estimate, which subtracted the overlapping total and so undercounted, often to 0. That old number is still exported as charsUnread.
- **charsUnread (2.101 meaning)** `derived` (`chars_unread_legacy`). When the cap is reached: extracted body characters − text in passages including overlap and intro; otherwise 0. *Unit:* characters, as the passage text holds them. *Limits:* Undercounts and can read 0 even when the cap cut a tail. Kept unchanged for compatibility; use characters past the cap.
- **Text in the raw HTML** `derived` (`text_raw`). Kept text plus every removal in the table below. An estimate of the document's text, defined so the waterfall sums exactly. *Unit:* characters, whitespace runs folded to one space. *Limits:* Script and style bodies count as text here because the cleaner has to remove them; it is not the text a reader sees.
- **Removed by the cleaner** `measured` (`text_removed`). For every element the cleaner removed (outermost only, so nothing counts twice): its own text at the moment of removal. Plus, when a main region was chosen, the text of everything outside it. *Unit:* characters, whitespace runs folded to one space. *Limits:* Observed on a second copy of the extraction, checked to give the same text; the removal itself is the product's rule and is not tuned here.
- **Kept text** `measured` (`text_kept`). The extractor's body text (the chunker's input), whitespace folded. *Unit:* characters, whitespace runs folded to one space. *Limits:* Differs slightly from page.bodyChars, which counts line breaks as they are.
- **Kept, but in no passage text** `derived` (`not_in_passages`). Kept text before the end of the last passage that no passage holds: h2 heading lines (carried as a passage's heading, not its text), the spaces between sections, and anything else (should be 0). *Unit:* characters, whitespace runs folded to one space. *Limits:* A retriever may still see a heading as the passage's metadata; this tool does not assume either way.
- **Overlap** `derived` (`overlap_chars`). Located passage text − unique text in passages: what neighbouring windows repeat. *Unit:* characters, whitespace runs folded to one space. *Limits:* By design, about 200 per cut inside a long section.
- **Intro** `measured` (`intro_chars`). The title, h1 and meta description the chunker puts at the start of passage #0. *Unit:* characters, whitespace runs folded to one space. *Limits:* Not part of the body text, so it is outside the waterfall's kept stage.
- **Characters removed by one element** `measured` (`removal_chars`). The removed element's text, whitespace folded, at the moment the cleaner removed it. *Unit:* characters, whitespace runs folded to one space. *Limits:* Elements with no text are counted but not listed. Beyond the first 200 the rest are summed, never dropped.
- **Section text that reached a passage** `derived` (`section_reached`). For each section the chunker made (the intro, the text before the first h2, each h2), the part of its text inside some passage, over its length. *Unit:* characters, whitespace runs folded to one space. *Threshold:* Under 100% means that section lost text, almost always to the cap. *Limits:* When the page has no usable h2 split, the body is one row.
- **robots.txt verdict** `measured` (`robots_verdict`). RFC 9309 over the site's /robots.txt: the group naming the token replaces *; the longest matching Allow or Disallow wins; Allow wins a tie. *Unit:* allowed / blocked per crawler. *Limits:* A 4xx robots.txt means no rules; 5xx or no answer means all blocked. Some user-fetch crawlers say they may ignore robots.txt.
- **Technical markup** `measured` (`markup`). From the raw HTML: every @type in application/ld+json blocks (through @graph), rel=canonical links, the meta description's length. *Unit:* types, links, characters. *Threshold:* Meta description: 70–160 characters. *Limits:* Read, not validated against schema.org.
- **Words with JavaScript** `measured` (`render_words`). The same extraction and chunking over the DOM a local headless Chrome dumped after running the page's scripts. *Unit:* words, passages. *Threshold:* 50% more words and at least 150 more raises js_dependent. *Limits:* Only with --render. The reading itself stays the plain fetch.
- **Group size** `derived` (`group_chars`). Passages in the group, and the sum of their lengths. *Unit:* characters, as the passage text holds them. *Limits:* Computed over the agent's groups, so it moves with the grouping.
- **Share of indexed text** `derived` (`group_share`). The group's characters over the characters of every passage (overlap included). *Unit:* percent. *Limits:* Computed over the agent's groups. Overlap counts in both neighbours.
- **Phrase and word counts** `derived` (`vocabulary`). Over the passages' text with the overlap removed: ×uses, the passages that use it (p), and how many groups it reaches (g/total). *Unit:* occurrences, passages, groups. *Threshold:* A phrase needs 2 uses in 2 passages, or 3 in one. *Limits:* What the page says, not search demand. The group count rests on the agent's groups.
- **Check verdicts** `derived` (`check_verdicts`). Fixed rules over the measured values, each a named constant in checks.mjs with its reason; every finding names the passages it rests on. *Unit:* findings, by severity. *Threshold:* Each check's threshold is in the check table of SKILL.md. *Limits:* repeated_claim uses the agent's groups; every other check does not.
- **Groups and labels** `judgement` (`groups`). The agent read every passage and grouped them by subject (at most 6); its label is its own. The label source is computed: a heading most members share, else two distinctive words. *Unit:* groups. *Threshold:* At most 6 groups. *Limits:* Not an embedding clustering; another model may group a little differently.
- **Repeats** `judgement` (`duplicates`). Passages the agent marked as repeating an earlier, non-adjacent passage almost word for word. *Unit:* passages. *Limits:* The product judges this from embeddings at cosine 0.94; here it is read.
- **Query test** `judgement` (`query_verdicts`). For 5 to 10 typical queries, the agent names the best passage and a verdict (complete, partial, missing) and quotes the answer; the quote is checked verbatim. *Unit:* queries. *Limits:* Judged from the passages only; it is not a measurement of what any assistant returns.
- **Rewrite plan** `judgement` (`plan`). The agent's fixes in priority order; each 'before' is checked verbatim against its passage, each cited check against the checks that fired. *Unit:* items. *Limits:* Advice, not a measurement.
- **Citable facts** `judgement` (`facts`). The agent's list of concrete facts the passages state, each with the passages that state it. *Unit:* facts. *Limits:* Fact gaps are only as fair as this list is complete.
- **Topic × page cells** `derived` (`topic_cells`). Passages and characters of the groups the agent assigned to each shared topic. *Unit:* characters, as the passage text holds them. *Limits:* Computed over the agent's groups and topics.
- **Changes since the baseline** `derived` (`diff_counts`). Passages matched by identical text, then by the same heading in order; the rest are added or removed. *Unit:* passages. *Limits:* A passage that moved and changed heading counts as removed plus added.
