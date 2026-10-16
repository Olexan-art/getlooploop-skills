[English](README.md) · Українська

# Навички GetLoopLoop

Agent Skills від [GetLoopLoop](https://www.getlooploop.com) для Claude Code, Codex, opencode, Hermes Agent та інших агентів, які завантажують навички у форматі `SKILL.md`.

| Навичка | Що робить |
|---|---|
| [`vectorscope`](skills/vectorscope/SKILL.md) | Показує, як система пошуку читає публічні сторінки: точні правила завантаження, видобування тексту, нарізання і ліміт у 26 уривків, як у продукті; вердикти robots.txt для ШІ-краулерів; автоматичні перевірки структури; групування, тест запитів і план переписування від агента. Порівнює від 2 до 5 сторінок. |

## Простими словами

Перш ніж ШІ-асистент зможе процитувати вашу сторінку, її має прочитати машина, і читає вона не так, як ви. Вона один раз завантажує сторінку, викидає меню, кнопки й футери, а решту ріже на уривки приблизно по 2 000 символів. Зберігає щонайбільше 26. Потім кожен уривок знаходять і цитують **окремо**, без решти сторінки.

Ця навичка проганяє будь-яку публічну сторінку тими самими кроками й підказує, що виправити: чи взагалі пускають ШІ-краулерів, які уривки втратили своє запитання чи свій предмет, що не вмістилося в ліміт у 26 уривків, на які типові запитання сторінка відповідає, а на які ні, і як переписати найслабші уривки, щоб кожен був самодостатнім.

Вона не ранжує сторінку, не ставить їй оцінку, не шукає тексту, написаного ШІ, і не передбачає, що про вас скаже будь-який асистент.

## Можливості

- **Читання очима машини:** точне завантаження, видобування, нарізання й ліміт у 26 уривків, як у живому інструменті; скільки слів лишилося, на скільки уривків вони поділилися, що вийшло за ліміт.
- **Спершу ШІ-краулери:** robots.txt перевіряється для GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Googlebot, Bingbot і CCBot за правилами RFC 9309. Якщо краулерам, які відповідають людям, закрито доступ, звіт каже про це раніше за все інше.
- **Автоматичні перевірки**, кожна з кодом, уривками, на яких вона ґрунтується, і доказами: відповіді FAQ, що загубили запитання; один заголовок, який несе забагато сторінки; уривки, розрізані посеред речення; навігація всередині вмісту; тонкі розділи; обрізані анонси; одне й те саме твердження в кожному розділі; canonical, JSON-LD і meta description.
- **Групування за прочитанням агента:** уривки згруповано за темою й названо, а власний заголовок сторінки чи ключові слова лишаються як джерело мітки.
- **Тест запитів:** від 5 до 10 типових запитань (ваших або від агента), найкращий уривок для кожного, чи відповідає він повністю, і точні слова, які ретривер міг би процитувати.
- **План переписування:** виправлення за пріоритетом, прив’язані до перевірок, з прикладами «було → стало» для найслабших уривків.
- **Порівняння від 2 до 5 сторінок** на одному спільному словнику тем: таблиця «теми × сторінки», прогалини в темах, прогалини у фактах і хто виграє кожен запит.
- **До і після:** порівняння сторінки з її попереднім читанням.
- **Необов’язковий рендер JavaScript** у локальному Chrome чи Chromium, щоб побачити, скільки сторінки з’являється лише після виконання скриптів.
- **Один самодостатній HTML-звіт** англійською або українською (перемикач угорі), у світлій чи темній темі, зручний на телефоні, без жодних мережевих запитів; а також Markdown і JSON.

Чому групи — це «прочитання агента»: живий інструмент групує уривки, порівнюючи їхні ембединги. Ця навичка не викликає жодних моделей чи ембедингів, тому агент, який її запускає, сам читає уривки й групує їх за темою. Завантаження, нарізання, ліміт і перевірки детерміновані; групування, вердикти щодо запитів і план — це судження, і скрипти перевіряють кожне з них (кожна цитата має дослівно збігатися з текстом свого уривка). Читання на ембедингах із картою — у безкоштовному інструменті на https://www.getlooploop.com/vectorscope.

## Що ви отримуєте

Звіт з інтерфейсом українською (вміст сторінки ніколи не перекладається):

![Звіт українською](docs/report-uk.png)

Верх звіту в темній і світлій темі:

![Верх звіту, темна тема: конвеєр, лічильники з досягнутим лімітом, смуга читання](docs/report-dark.png)

![Верх звіту, світла тема](docs/report-light.png)

Перевірки: спершу таблиця ШІ-краулерів, далі технічна розмітка і знахідки, кожна з уривками й порадою, що робити:

![Таблиця ШІ-краулерів і перевірки](docs/report-checks.png)

План переписування з прикладами «було → стало»:

![План переписування](docs/report-plan.png)

Тест запитів:

![Тест запитів](docs/report-queries.png)

Порівняння двох сторінок: теми × сторінки, прогалини в темах і хто виграє кожен запит:

![Режим порівняння](docs/report-compare.png)

Футер і звіт на телефоні:

![Футер](docs/report-footer.png)

![Звіт на вузькому екрані](docs/report-mobile.png)

У теці [`examples/`](examples) лежать три справжні запуски, а файли, які написав агент, — у [`examples/judgement/`](examples/judgement):

- сама сторінка Vectorscope: їй вистачає 17 уривків, і нічого не губиться ([HTML](examples/getlooploop-vectorscope.html), [Markdown](examples/getlooploop-vectorscope.md), [JSON](examples/getlooploop-vectorscope.json));
- стаття Вікіпедії про великі мовні моделі: вона займає всі місця й лишає непрочитаними близько 53 000 символів ([HTML](examples/wikipedia-llm.html), [Markdown](examples/wikipedia-llm.md), [JSON](examples/wikipedia-llm.json));
- посібник MDN з HTTP-кешування проти статті web.dev про HTTP-кеш ([HTML](examples/http-caching-compare.html), [Markdown](examples/http-caching-compare.md), [JSON](examples/http-caching-compare.json)).

Звіти в прикладах англійською за замовчуванням; додайте `#lang=uk` до адреси або натисніть UK угорі.

## Встановлення

Навичці потрібен Node 18 або новіший. Єдина залежність — [cheerio](https://cheerio.js.org/). Скопіюйте теку туди, де ваш агент шукає навички (наступний розділ), а потім один раз:

```
cd <тека навичок>/vectorscope && npm install --omit=dev
```

## Використання з вашим агентом

Навичка — це одна тека, `skills/vectorscope`, з файлом `SKILL.md` і скриптами на Node. Агенти з підтримкою Agent Skills завантажують її зі своєї теки навичок; будь-який інший агент може виконувати `SKILL.md` як інструкцію. В обох випадках агент запускає ті самі команди з теки навички, а читає уривки модель самого агента.

```
git clone https://github.com/Olexan-art/getlooploop-skills.git
```

**Claude Code** завантажує особисті навички з `~/.claude/skills/`, а навички проєкту — з `.claude/skills/`.

```
mkdir -p ~/.claude/skills && cp -r getlooploop-skills/skills/vectorscope ~/.claude/skills/vectorscope   # особисто
mkdir -p .claude/skills && cp -r getlooploop-skills/skills/vectorscope .claude/skills/vectorscope       # або: лише цей проєкт
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse getlooploop-skills\skills\vectorscope "$HOME\.claude\skills\vectorscope"
```

**OpenAI Codex (CLI, розширення для IDE, застосунок)** переглядає `$HOME/.agents/skills` (рівень користувача) і `.agents/skills` у кожній теці від місця запуску до кореня репозиторію (рівень репозиторію).

```
mkdir -p ~/.agents/skills && cp -r getlooploop-skills/skills/vectorscope ~/.agents/skills/vectorscope
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.agents\skills" | Out-Null
Copy-Item -Recurse getlooploop-skills\skills\vectorscope "$HOME\.agents\skills\vectorscope"
```

**opencode** завантажує глобальні навички з `~/.config/opencode/skills/`, `~/.claude/skills/` або `~/.agents/skills/`, а навички проєкту — з `.opencode/skills/`, `.claude/skills/` або `.agents/skills/` (піднімаючись до кореня git). Копію, зроблену вище для Claude Code чи Codex, він теж підхопить; інакше:

```
mkdir -p ~/.config/opencode/skills && cp -r getlooploop-skills/skills/vectorscope ~/.config/opencode/skills/vectorscope
```

**Hermes Agent (Nous Research)** тримає навички в `~/.hermes/skills/`. Він також читає `<проєкт>/.hermes/skills/` і `<проєкт>/.agents/skills/`, щойно ви позначите репозиторій довіреним командою `hermes skills trust`, і будь-яку теку зі списку `skills.external_dirs` у `~/.hermes/config.yaml` (наприклад, `~/.agents/skills`).

```
mkdir -p ~/.hermes/skills && cp -r getlooploop-skills/skills/vectorscope ~/.hermes/skills/vectorscope
```

**GLM** (Zhipu / Z.ai) — це сімейство моделей, а не агент. GLM Coding Plan від Z.ai використовують усередині агентів для програмування; серед них його документація називає Claude Code, Codex і OpenCode. Встановіть навичку для того агента, у якому працює GLM, як описано вище: тоді навичка виконується за правилами цього агента, а читає уривки GLM.

**Будь-який інший агент:** вкажіть на навичку у файлі його інструкцій (наприклад, `AGENTS.md`), щоб він прочитав кроки, перш ніж почати:

```
For questions about how AI assistants read a web page, follow skills/vectorscope/SKILL.md and run its scripts from that folder.
```

Джерела: [навички Claude Code](https://code.claude.com/docs/en/skills) · [навички Codex](https://learn.chatgpt.com/docs/build-skills) (сюди тепер переспрямовує developers.openai.com/codex/skills) · [навички opencode](https://opencode.ai/docs/skills) · [навички Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) · [GLM Coding Plan від Z.ai](https://docs.z.ai/devpack/overview). Перевірено 16.10.2026; теки навичок змінюються між версіями, тож якщо шлях не спрацював, звірте з актуальною документацією свого агента.

## Vectorscope коротко

```
node scripts/read.mjs https://example.com/page --out reading.json   # завантаження → текст → уривки → ліміт, robots.txt, перевірки
# агент читає уривки й пише groups.json
node scripts/lens.mjs reading.json groups.json --html report.html   # мітки, ключові слова, усі перевірки
# агент пише queries.json і plan.json
node scripts/lens.mjs reading.json groups.json --queries queries.json --plan plan.json --html report.html --md report.md --json export.json

node scripts/read.mjs <url1> <url2> --out-dir readings              # порівняння; далі topics.json, groups-<n>.json, facts.json, queries.json
node scripts/lens.mjs --compare readings/manifest.json --html readings/compare.html
```

Скрипти не викликають жодних моделей чи ембедингів і нікуди нічого не надсилають, окрім GET-запитів до сторінки та її robots.txt (а з `--render` сторінку ще відкриває локальний браузер). Поля, для яких потрібні вектори (згуртованість, самоподібність, проєкція), подано як `null`, а не оцінено навмання. HTML-звіт екранує кожен шматок тексту сторінки й має політику безпеки вмісту, що блокує з нього всі мережеві запити, бо уривки — це вміст третьої сторони. `npm test` запускає тести.

## Ліцензія

Вільно використовуйте, змінюйте й поширюйте за ліцензією MIT, див. [LICENSE](LICENSE). Якщо публікуєте щось, зроблене з її допомогою, будемо вдячні за посилання на [getlooploop.com](https://www.getlooploop.com).
