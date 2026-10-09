# Superpowers MCP टूलपैक उपयोग मार्गदर्शिका

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Português (BR)](README.pt-BR.md) | [हिन्दी](README.hi.md)

[![संस्करण](https://img.shields.io/badge/version-6.4.7-blue.svg)](https://github.com/Poseidoncode/superpowers-mcp)
[![लाइसेंस](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

यह दस्तावेज़ Superpowers skills लाइब्रेरी और स्वायत्त वर्कफ़्लो सिस्टम को एक स्वतंत्र, उच्च-प्रदर्शन और सुरक्षित **Model Context Protocol (MCP)** सर्वर के रूप में पैकेज करने की जानकारी और उपयोग निर्देशों का सारांश है।

---

## 🚀 इंस्टॉल और उपयोग कैसे करें

### समर्थित वातावरण और प्लेटफ़ॉर्म

- **AI कोड एडिटर और IDE**: **Antigravity (AGY)**, **Cursor**, **VSCode** (GitHub Copilot), **VSCode Insiders** (GitHub Copilot), **Devin Desktop**, **Trae**, **Cline**, **Kilo Code**, **Qoder**, **Kiro**, **MiniMax Code Desktop** (मैन्युअल सेटअप), **Codex**।
- **AI डेस्कटॉप ऐप और एजेंट प्लेटफ़ॉर्म**: **Claude Desktop**, **Pi Desktop**, **QwenPaw**, **Hermes Desktop**, **Kimi Work**, **Goose**, **OpenClaw**।
- **लोकल और सेल्फ-होस्टेड AI प्लेटफ़ॉर्म**: **AnythingLLM**, **LibreChat**।

### उपलब्ध MCP क्षमताएँ

| प्रोटोकॉल सुविधा | आइटम / संख्या | विवरण |
| :--- | :--- | :--- |
| **Tools** | `list_skills`, `read_skill` | माँग पर हर skill के पूर्ण निर्देश और चेकलिस्ट खोजें, पढ़ें और लोड करें। |
| **Prompts** | 9 Native Prompts | `session-start`, `feature-pipeline`, `structured-debug`, `skill-composition`, `sdd-implementer`, `sdd-task-reviewer`, `sdd-re-review`, `spec-reviewer`, `plan-reviewer` |
| **Resources** | 15 Skill URIs + 1 Guide | `skill://superpowers/<skill-name>` तथा `guide://superpowers/skill-compositions` |

### AI एजेंट से बातचीत (बुनियादी उपयोग)

इंस्टॉल या कॉन्फ़िगर होने के बाद आपका MCP क्लाइंट Superpowers के tools, prompts और resources खोज सकता है। MCP prompt उपयोगकर्ता द्वारा चलाए जाते हैं; अपने क्लाइंट के MCP Prompts मेनू से चुनें। इसके बाद skill लोड होना इस पर निर्भर करता है कि एजेंट चुने गए prompt का पालन करके `read_skill` कॉल करे।

**बुनियादी संवाद उदाहरण:**
- **इंजीनियरिंग अनुशासन शुरू करें:** "`session-start` prompt लगाएँ" (Superpowers नियम व संदर्भ इंजेक्ट करता है)
- **उपलब्ध skills खोजें:** "सभी superpowers skills की सूची दिखाओ"
- **एक skill लोड करें:** "`read_skill` से `brainstorming` skill लोड करो और आवश्यकताओं का विश्लेषण करने में मदद करो"

---

## ⚡ लक्षित वन-क्लिक सेटअप

बिना किसी छिपे हुए बैकग्राउंड बदलाव के Superpowers तुरंत शुरू करने के लिए हमारे **लक्षित, गोपनीयता-सम्मानजनक** वन-क्लिक सेटअप टूल का उपयोग करें।

> [!NOTE]
> **किसी भी डायरेक्टरी से चलाएँ**: आपको यह रिपॉज़िटरी क्लोन करने या किसी खास फ़ोल्डर में जाने की ज़रूरत नहीं है। आप अपने टर्मिनल में **किसी भी डायरेक्टरी** से सीधे ये कमांड चला सकते हैं। इंस्टॉलर आपके होम डायरेक्टरी (`~`) में ग्लोबल कॉन्फ़िग फ़ाइलों को स्वतः लक्षित करता है और सभी workspaces में Superpowers तुरंत सक्षम कर देता है।

ChatWise और Cherry Studio में मैन्युअल इम्पोर्ट आवश्यक है, [डेस्कटॉप इम्पोर्ट गाइड](docs/desktop-setup.md) देखें।

### 1. अपना AI एजेंट / एडिटर चुनें (लक्षित वन-लाइनर)

अपना क्लाइंट चुनें और टर्मिनल में संबंधित कमांड चलाएँ:

| प्लेटफ़ॉर्म / क्लाइंट | समर्थित OS | वन-क्लिक सेटअप कमांड | ग्लोबल कॉन्फ़िग स्थान |
| :--- | :--- | :--- | :--- |
| **LM Studio** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target lmstudio` | `~/.lmstudio/mcp.json` |
| **Roo Code (VS Code Desktop)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target roo` | `.../rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| **Antigravity (Google DeepMind)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target antigravity` | `~/.gemini/config/mcp_config.json` |
| **Pi Desktop / Pi Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target pi-desktop` | `~/.pi/agent/mcp.json` |
| **Cursor** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cursor` | `~/.cursor/mcp.json` |
| **GitHub Copilot (VS Code)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot` | `Code/User/mcp.json` *(VS Code `servers` स्कीमा)* |
| **GitHub Copilot (VS Code Insiders)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target copilot-insiders` | `Code - Insiders/User/mcp.json` *(VS Code `servers` स्कीमा)* |
| **Hermes Desktop / Agent** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target hermes` | `~/.hermes/config.yaml` *(Win: `%LOCALAPPDATA%\hermes`)* |
| **Kimi Work / Kimi Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kimi` | `~/.kimi-code/mcp.json` |
| **Claude Desktop** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target claude` | `Claude/claude_desktop_config.json` |
| **Devin Desktop (पूर्व Windsurf)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target devin` | `~/.config/devin/mcp_config.json` *(या `windsurf`)* |
| **QwenPaw (पर्सनल एजेंट वर्कस्टेशन)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qwenpaw` | `~/.qwenpaw/config.json` *(उपनाम: `copaw`)* |
| **Cline (VS Code / CLI)** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target cline` | `.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| **Kilo Code** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kilo` | `~/.config/kilo/kilo.jsonc` *(नेटिव `mcp` स्कीमा)* |
| **Qoder** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target qoder` | `~/.qoder/settings.json` |
| **Kiro** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target kiro` | `~/.kiro/settings/mcp.json` |
| **Trae** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target trae` | `.../Trae/User/mcp.json` *(Trae CN समर्थित)* |
| **Codex** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target codex` | `~/.codex/config.toml` *(TOML `[mcp_servers]`)* |
| **OpenClaw** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target openclaw` | `~/.openclaw/openclaw.json` *(JSON5 `mcp.servers`)* |
| **Goose** | macOS / Windows / Linux | `npx -y superpowers-mcp setup --target goose` | `~/.config/goose/config.yaml` *(Win: `%APPDATA%\Block\goose\config\config.yaml`)* |

*(यदि Bun उपयोग करते हैं, तेज़ स्टार्टअप के लिए `--bun` जोड़ें, उदा. `npx -y superpowers-mcp setup --target cursor --bun`)*

---

### 2. Curl या PowerShell द्वारा सेटअप

- **macOS / Linux (स्पष्ट target के साथ Curl द्वारा):**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.sh | bash -s -- --target cursor
  ```

- **Windows (स्पष्ट target के साथ PowerShell द्वारा):**
  ```powershell
  & ([scriptblock]::Create((irm https://raw.githubusercontent.com/Poseidoncode/superpowers-mcp/main/scripts/install.ps1))) -Target cursor
  ```

#### उन्नत फ़्लैग:
- `--dry-run`: डिस्क पर लिखे बिना बदलावों का पूर्वावलोकन करें।
- `--remove`: लक्षित क्लाइंट से Superpowers कॉन्फ़िगरेशन सुरक्षित रूप से हटाएँ।
- `--backup`: संशोधन से पहले टाइमस्टैम्प वाला `.bak` बैकअप बनाएँ (डिफ़ॉल्ट: बंद, शून्य-प्रदूषण)।
- `--bun`: जेनरेट की गई कॉन्फ़िगरेशन में `npx` के बजाय `bunx` उपयोग करें।
- `--target <name>`: स्पष्ट लक्ष्य नाम (उपनाम समर्थित, उदा. `code`, `vscode`, `kimi-code`)।

---

## 🛠️ मैनुअल MCP कॉन्फ़िगरेशन

यदि आप मैनुअल कॉन्फ़िगर करना पसंद करते हैं, तो अपने IDE या MCP क्लाइंट (उदा. Cursor, Antigravity, VSCode, AnythingLLM आदि) में निम्न सेटिंग जोड़ें।

### विधि: NPX / BUNX (अनुशंसित)

यह सबसे आसान तरीका है क्योंकि यह पाथ समाधान स्वतः संभालता है।

#### Bun द्वारा (तेज़)
```json
{
  "superpowers": {
    "command": "bunx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

#### Node/NPM द्वारा
```json
{
  "superpowers": {
    "command": "npx",
    "args": ["-y", "superpowers-mcp"]
  }
}
```

---

## 🔄 Skill संयोजन और वर्कफ़्लो पाइपलाइन

जटिल इंजीनियरिंग कार्यों के लिए इन **इंटरैक्टिव वर्कफ़्लो लॉन्चरों** का उपयोग करें। ये एजेंट-निर्देशित प्रक्रिया शुरू करते हैं और डिज़ाइन, योजना-समीक्षा और ब्रांच-समापन निर्णयों पर रुकते हैं; ये सर्वर-साइड या बिना निगरानी नहीं चलते। प्रकाशित [`Skill Compositions मार्गदर्शिका`](docs/skill-compositions.hi.md) देखें, जो MCP resource `guide://superpowers/skill-compositions` के रूप में भी उपलब्ध है।

### 1. नई सुविधा विकास पाइपलाइन
```
brainstorming ➔ writing-plans ➔ using-git-worktrees ➔ subagent-driven-development (TDD) ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **शुरू कैसे करें:** अपने क्लाइंट के MCP Prompts मेनू से `feature-pipeline` चुनें और `feature_name` तथा वैकल्पिक `requirements` दें।
- **वर्कफ़्लो:** आवश्यकताएँ स्पष्ट करें (Spec) ➔ डिज़ाइन अनुमोदन की प्रतीक्षा करें ➔ समीक्षायोग्य योजना बनाएँ ➔ योजना अनुमोदन की प्रतीक्षा करें ➔ worktree अलग करें ➔ SDD या इनलाइन फ़ॉलबैक और TDD से कार्यान्वयन करें ➔ सत्यापित करें ➔ समीक्षा करें ➔ पूछें कि ब्रांच कैसे समाप्त करें।
- **फ़ॉलबैक:** यदि होस्ट में मल्टी-एजेंट टूल नहीं हैं, तो वर्कफ़्लो subagents भेजने का दावा करने के बजाय `executing-plans` उपयोग करता है।

### 2. संरचित समस्या-निवारण पाइपलाइन
```
systematic-debugging ➔ using-git-worktrees ➔ dispatching-parallel-agents ➔ test-driven-development ➔ verification-before-completion ➔ requesting-code-review ➔ finishing-a-development-branch
```
- **शुरू कैसे करें:** अपने क्लाइंट के MCP Prompts मेनू से `structured-debug` चुनें और समस्या या असफल टेस्ट बताएँ।
- **वर्कफ़्लो:** मूल कारण परिकल्पनाएँ बनाएँ ➔ समानांतर एजेंटों के लिए worktrees अलग करें ➔ असफल पुनरुत्पादन टेस्ट लिखें ➔ लक्षित सुधार लागू करें ➔ शून्य रिग्रेशन की पुष्टि करें ➔ सुधार की समीक्षा करें ➔ ब्रांच समाप्त करें।

### 3. गतिशील वर्कफ़्लो मार्गदर्शिका
- **शुरू कैसे करें:** रीफ़ैक्टरिंग, माइग्रेशन या लेगेसी कोडबेस के लिए अनुशंसित वर्कफ़्लो पाने हेतु `skill-composition` चुनें। इन परिदृश्यों के लिए वर्तमान में कोई समर्पित लॉन्चर prompt नहीं है।
- **वर्कफ़्लो:** बड़े रीफ़ैक्टर, माइग्रेशन सुरक्षा-जाल या ऑनबोर्डिंग के लिए इष्टतम मल्टी-skill संयोजन गतिशील रूप से अनुशंसित करता है:
  - **बड़ा रीफ़ैक्टरिंग व माइग्रेशन:** `brainstorming` ➔ `writing-plans (skeleton-first)` ➔ `using-git-worktrees` ➔ `subagent-driven-development` ➔ `verification-before-completion` ➔ `requesting-code-review` ➔ `finishing-a-development-branch`
  - **लेगेसी कोडबेस सुरक्षा-जाल:** `brainstorming` ➔ `writing-plans` ➔ `test-driven-development (characterization)` ➔ `systematic-debugging` ➔ `verification-before-completion`


---

## 📋 समर्थित Skills अवलोकन (15 मुख्य Skills और परिदृश्य)

सही skill चुनने में मदद के लिए हमने सभी 15 skills को सॉफ़्टवेयर विकास जीवनचक्र (SDLC) में संरचित किया है, जिसमें मुख्य क्षमताएँ और समुदाय-अनुशंसित परिदृश्य समाहित हैं:

| # | SDLC चरण | Skill नाम | यह क्या करता है (उद्देश्य व मुख्य मूल्य) | अनुशंसित परिदृश्य |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🚀 योजना व डिज़ाइन** | **`brainstorming`** | **आवश्यकता व आर्किटेक्चर डिज़ाइन**: कोडिंग से पहले विकल्पों और बाधाओं का पता लगाता है; डिज़ाइन Spec आउटपुट करता है; Visual Companion ब्राउज़र UI समीक्षा सहित। | किसी भी नई सुविधा या बड़े बदलाव से पहले; सीधे कोड में कूदने से रोकता है। |
| 2 | **🚀 योजना व डिज़ाइन** | **`writing-plans`** | **कार्यान्वयन योजना**: Spec को छोटे, परीक्षणयोग्य कार्यों में बाँटता है, अनुशंसित Skills और सटीक फ़ाइल संदर्भों सहित। | मल्टी-फ़ाइल रीफ़ैक्टर, जटिल माइग्रेशन या बड़े कार्यान्वयन से पहले। |
| 3 | **💻 कार्यान्वयन** | **`executing-plans`** | **सत्र में योजना निष्पादन**: वर्तमान सत्र में हर नियोजित कार्य चरण-दर-चरण चलाता है, फिर अंत में पूरे ब्रांच की एक समीक्षा करता है। | बिना subagents बनाए उसी सत्र में योजनाओं का बैच निष्पादन। |
| 4 | **💻 कार्यान्वयन** | **`subagent-driven-development`** | **Subagent-चालित विकास (SDD)**: प्रति कार्य ताज़ा, संदर्भ-पृथक subagents भेजता है, दोहरी प्रतिकूल समीक्षाओं सहित। | जटिल योजनाओं के लिए अनुशंसित निष्पादन मॉडल, संदर्भ प्रदूषण समाप्त करता है। |
| 5 | **💻 कार्यान्वयन** | **`test-driven-development`** | **टेस्ट-चालित विकास (TDD)**: सख्त Red ➔ Green ➔ Refactor चक्र लागू करता है, मज़बूत टेस्ट कवरेज सुनिश्चित करता है। | तार्किक रूप से चुनौतीपूर्ण सुविधाओं या महत्वपूर्ण एल्गोरिदम लागू करते समय। |
| 6 | **🔍 डिबगिंग** | **`systematic-debugging`** | **व्यवस्थित मूल-कारण डिबगिंग**: जटिल त्रुटियों को परीक्षणयोग्य परिकल्पनाओं में बाँटता है, सत्यापन प्रयोगों सहित। | किसी भी अप्रत्याशित त्रुटि, टेस्ट विफलता या रुक-रुक कर आने वाले बग पर। |
| 7 | **🛡️ गुणवत्ता व समीक्षा** | **`verification-before-completion`** | **साक्ष्य-आधारित सत्यापन**: पूर्ण टेस्ट सूट, linter और टाइप जाँच चलाना अनिवार्य करता है। | "हो गया" या "ठीक है" कहने से पहले; पूर्णता का ठोस प्रमाण देता है। |
| 8 | **🛡️ गुणवत्ता व समीक्षा** | **`requesting-code-review`** | **कोड समीक्षा प्रारंभ**: बहु-आयामी आर्किटेक्चर और गुणवत्ता समीक्षाओं के लिए diffs और रिपोर्ट पैकेज करता है। | ब्रांच मर्ज या कार्य अंतिम करने से पहले आर्किटेक्चर अखंडता सुनिश्चित करने हेतु। |
| 9 | **🛡️ गुणवत्ता व समीक्षा** | **`receiving-code-review`** | **समीक्षा प्रतिक्रिया प्रसंस्करण**: समीक्षा प्रतिक्रिया का व्यवस्थित मूल्यांकन करता है, सुधार लागू करता है और निर्णय दर्ज करता है। | समीक्षा निष्कर्षों को संदर्भ खोए बिना व्यवस्थित रूप से संबोधित करते समय। |
| 10 | **🛡️ गुणवत्ता व समीक्षा** | **`finishing-a-development-branch`** | **ब्रांच एकीकरण व सफ़ाई**: PR/merge प्रबंधित करता है, Git worktrees साफ़ करता है और अस्थायी ब्रांच हटाता है। | सभी सत्यापन पास होने के बाद सुविधा को मुख्य ब्रांच में साफ़-सुथरा एकीकृत करने हेतु। |
| 11 | **🌿 संस्करण नियंत्रण** | **`using-git-worktrees`** | **भौतिक Git पृथक्करण**: सुविधाओं या डिबगिंग के लिए पृथक worktree डायरेक्टरी बनाता है, रेस कंडीशन रोकता है। | समवर्ती कार्यों या समानांतर मल्टी-एजेंट जाँच पर काम करते समय। |
| 12 | **🤖 उन्नत एजेंट** | **`dispatching-parallel-agents`** | **समानांतर एजेंट ऑर्केस्ट्रेशन**: पृथक workspaces में समवर्ती subagents भेजकर कई परिकल्पनाओं की एक साथ जाँच करता है। | जब कई असफल टेस्ट हों या स्वतंत्र सिद्धांतों की समानांतर जाँच करनी हो। |
| 13 | **🤖 उन्नत एजेंट** | **`using-superpowers`** | **Superpowers आधार व अनुशासन**: अनिवार्य skill खोज, लोडिंग अनुशासन और प्राथमिकता नियम स्थापित करता है। | सत्र प्रारंभ में स्वतः लोड होकर सॉफ़्टवेयर इंजीनियरिंग मानक लागू करता है। |
| 14 | **🤖 उन्नत एजेंट** | **`writing-skills`** | **Skill लेखन व रखरखाव**: नई Superpowers skills बनाने, परीक्षण और पैकेजिंग का मार्गदर्शन करता है। | कस्टम skills बनाते या मौजूदा निर्देश बढ़ाते समय। |
| 15 | **🤖 उन्नत एजेंट** | **`diagnosing-superpowers`** | **सत्र फॉरेंसिक व मेंटेनर रिपोर्ट**: डिस्क पर ट्रांसक्रिप्ट से उद्धृत साक्ष्य सहित गड़बड़ी का पुनर्निर्माण करता है; स्क्रब किए गए बंडल और GitHub issue मसौदे तैयार करता है। | जब सत्र बिगड़ जाए और कारण का साक्ष्य चाहिए हो, या मेंटेनरों को बग रिपोर्ट देनी हो। |

## 🆕 हाल के अपडेट

### v6.4.7 (नवीनतम)

- **पूर्ण प्रोजेक्ट सुरक्षा स्कैन (2026-10-09)**: `src/*.ts`, brainstorming companion सर्वर, `scripts/`, `esbuild.js`, npm पैकेजिंग व लॉकफ़ाइल अखंडता, रहस्य/अनुमति स्वच्छता, और हर स्वचालित सूट। आधार नियंत्रण पुनः सत्यापित और स्वच्छ — शिप किए गए स्रोत में `eval` / `new Function` / `innerHTML` / `document.write` / `shell: true` 0, `child_process` केवल argv द्वारा, 0 हार्डकोडेड रहस्य, 0 world-writable ट्रैक की गई फ़ाइलें (विवरण [SECURITY.md](SECURITY.md) में)।
- **`--remove` सफलता की सूचना दे सकता था जबकि एक सक्रिय MCP प्रविष्टि बची रहती थी** (CWE-459, निष्पादन द्वारा पुनरुत्पादित): TOML अंतिम `[[mcp_servers.superpowers]]` array table को छोड़कर बाकी सभी रखता है और `[[mcp_servers.superpowers.env]]` को अनाथ कर देता है; JSON केवल पहली root key को साफ़ करता है जिसमें `superpowers` प्रविष्टि हो; भरे हुए flow map `superpowers: {…}` पर YAML हटाना no-op रहता है। इसलिए कॉलर-चयनित `command` सफलता की सूचना देने वाली अनइंस्टॉल के बाद भी स्वतः लॉन्च होता रह सकता है।
- **YAML `--remove` किसी अन्य पैरेंट का `superpowers` ब्लॉक मिटा सकता था** (CWE-459): नया root-स्तरीय रक्षक खाली-मैप पुनः लेखन को तो कवर करता है पर प्रविष्टि हटाने को नहीं, इसलिए किसी भिन्न top-level key के अधीन नेस्टेड `mcp_servers:` अपना `superpowers` सबट्री खो देता था — `env` जैसे user keys सहित।
- **`SKILLS_PATH` निहितता blocklist पर आधारित है, allowlist पर नहीं** (CWE-22, पहले से मौजूद): `~/.ssh`, `~/.config/gh` और `/Users/Shared` स्वीकृत होते हैं क्योंकि वे मौजूद हैं, जबकि `~/.aws` केवल गैर-अस्तित्व के कारण अस्वीकृत होता है। **Linux** पर दस्तावेज़बद्ध `SKILLS_PATH=$(mktemp -d)` प्रवाह world-writable `/tmp` पर पहुंचता है, इसलिए साझा होस्ट पर एक स्थानीय उपयोगकर्ता ऐसी skill सामग्री रोप सकता है जिसे एजेंट फिर विश्वसनीय निर्देश मानता है।
- **`[MODEL]` अब `sdd-task-reviewer` / `sdd-re-review` के लिए गिराया नहीं जाता** (इसी स्कैन में मिला, यहाँ ठीक किया गया): दोनों टेम्पलेट उस स्लॉट को `model: [MODEL — REQUIRED: …]` इस तरह लिखते थे कि उसमें कोई शाब्दिक टोकन न था, इसलिए कॉलर का `model` मान रेंडर किए गए प्रॉम्प्ट में **zero** बार पहुंचता था और नया डायग्नोस्टिक उसे नहीं देख सका। अब दोनों `model: [MODEL]` के साथ एक `#` टिप्पणी लगाते हैं, जो `implementer-prompt.md` से मेल खाती है, और दो अभिकथन — बिना उसके विफल, उसके साथ सफल — इसे बाँधे हुए हैं।
- **CodeQL `js/polynomial-redos` #9/#10 बंद — YAML प्रबंधित प्रविष्टि मैचर द्विघात था** (निष्पादन द्वारा पुनरुत्पादित): `managedEntryPattern` में एक वैकल्पिक `{…}` समूह दो `\s*` के बीच रखा गया था, इसलिए उस पंक्ति में जिसे पैटर्न पूरा नहीं कर सकता था, इंजन उस whitespace रन की हर विभाजना पर पुनः प्रयास करता था। किसी विशेष payload की आवश्यकता नहीं — `superpowers:` + लंबा whitespace रन + **एक अनावश्यक वर्ण** एक सामान्य त्रुटिपूर्ण कॉन्फ़िगरेशन पंक्ति ही है, और 200 KB की एक पंक्ति एक ही मिलान में **18.3 s** लेती थी, जिससे `setup` अवरुद्ध हो जाता था। इसे एक-पास स्कैनर `managedEntryIndent()` से बदल दिया गया: **18.3 s → 0.08 ms**। स्वीकृत पंक्तियों का सेट प्रमाणित रूप से अपरिवर्तित है (हटाए गए regex के विरुद्ध **300 030** पंक्तियों का differential fuzz **0** बेमेल देता है), तीनों सह-पैटर्न रैखिक मापे गए और वैसे ही छोड़े गए हैं, और `tests/setup_test.js` में दो नए मामले समय और स्वीकृति के सटीक सेट—दोनों को पिन करते हैं (कमज़ोर संस्करण पर विफल, सुधरे संस्करण पर सफल, सत्यापित)।
- **पैकेजिंग कठोरता के लक्ष्य**: `npm pack` पुनर्निर्माण नहीं करता (`prepublishOnly` केवल publish-हेतु है और `out/` gitignored है, इसलिए पैक किया गया टारबॉल डिस्क पर मौजूद `out/*.js` बिना समीक्षा के शिप करता है — बिल्ड को `prepack` में होना चाहिए); और `files: ["scripts"]` इंस्टॉलर शिप करता है, जो सह-स्थित `setup.js` को प्राथमिकता देता है।
- सत्यापन: `npm test` हरा **10/10 सूट**, PowerShell सूट **128/128**, `npx tsc --noEmit` स्वच्छ, `npm run build` ठीक, `npm audit` **0** कमज़ोरियाँ, `npm run drift` 0 (रिग्रेशन फ़्लोर पुनः मापा गया **398 अभिकथन**: Node.js 238 + Bash 32 + PowerShell 128)।

### v6.4.6

- **पूर्ण सुरक्षा स्कैन (2026-10-06)**: `src/*.ts`, brainstorming companion सर्वर, `scripts/` और बिल्ड पाइपलाइन में कोई नई खोज नहीं — वितरित कोड में `eval` / `new Function` / `innerHTML` / `shell: true` 0, चाइल्ड प्रोसेस केवल argv द्वारा, `crypto.randomBytes` अस्थायी nonce, 0 हार्डकोडेड रहस्य, 0 world-writable फ़ाइलें (विवरण [SECURITY.md](SECURITY.md) में)।
- **निर्भरता परामर्श ठीक (`npm audit` 2 → 0)**: GHSA-6qxp-vccf-f47h (उच्च, MCP SDK OAuth क्रेडेंशियल लीक) `@modelcontextprotocol/sdk` को `^1.32.1` पर बढ़ाकर ठीक; GHSA-jqcg-44mw-7w3h (गंभीर, `express` के माध्यम से `proxy-addr` IP स्पूफिंग) नए `overrides.proxy-addr ^2.0.8` फ्लोर से ठीक। दोनों केवल बिल्ड-समय में हैं और stdio-only पैकेज से अप्राप्य।
- **v6.4.5 के बाद के स्रोत सुधार दर्ज**: brainstorming फ्रेम इंजेक्शन function replacer से शाब्दिक `$` टोकन सुरक्षित रखता है; single-flight स्किल स्कैन, उद्धृत YAML रूट-कुंजी प्रबंधन (खाली-मैप उत्सर्जन व CRLF संरक्षण सहित), और placeholder-key प्रॉम्प्ट संलग्न रक्षक।
- सत्यापन: `npm test` हरा (आधार **409 अभिकथन**: setup 78/78, edge-cases 12/12, brainstorming 35/35, prompts 18/18), `tsc` स्वच्छ, `npm audit` 0 कमज़ोरियाँ।

### v6.4.5

- **अपस्ट्रीम `obra/superpowers@8ca22db` (v6.4.2, 2026-09-25, PR #2384 "leaner plans") के साथ सिंक**: `writing-plans` अब कोड की प्रतिलिपि के बजाय उन निर्णयों को दर्ज करता है जिन्हें लागू करने वाले को चाहिए (हस्ताक्षर, टेस्ट असर्टन, spec मान) — स्पष्ट `Spec:` पथ वाला नया spec-केंद्रित प्लान हेडर, नया `## What a Step Contains` चरण टेम्पलेट, `## Bite-Sized Task Granularity` से `## Step Granularity` नाम परिवर्तन, और सात-जाँच वाला `## Self-Review`।
- **फोर्क सामग्री मर्ज में सुरक्षित**: फोर्क-केवल `## Two Plan Shapes` अनुभाग और `skeleton-first-plans.md` अक्षुण्ण रहते हैं; `plan-document-reviewer-prompt.md` फोर्क में रहता है क्योंकि `src/server.ts` उसे `plan-reviewer` MCP प्रॉम्प्ट के रूप में रेंडर करता है।
- **drift baseline `8ca22db` पर फिर से दर्ज** (74/74 अपस्ट्रीम स्किल फ़ाइलें, `npm run drift` साफ़); `tests/upstream_sync_test.js` में नया रिग्रेशन `Test 19 (v6.4.2)`।
- **दस्तावेज़ी और स्कैन स्वच्छता**: इस README की स्किल सारणी और `docs/skill-compositions.*` उदाहरण वर्तमान `writing-plans` टेम्पलेट से मेल खाते हैं (हटाए गए "फ़ाइल अनुबंध" के बजाय सटीक फ़ाइल संदर्भ); `npm run drift` अब OS फ़ाइलों (`.DS_Store`) को फोर्क-केवल नहीं गिनता।

### v6.4.4

- **CodeQL सुधार व सुरक्षा पैच (2026-09-28)**:
  - कोड स्कैनिंग अब **0 खुले / 7 ठीक**: v6.4.3 के विरुद्ध रिपोर्ट किए गए `src/setup-runner.ts` के 3 अलर्ट बंद (विवरण [SECURITY.md](SECURITY.md) में)।
  - **TOML ReDoS सुधार**: उद्धृत-तालिका पहचान regex को रैखिक स्कैनर से बदला — दुर्भावनापूर्ण कॉन्फ़िग पंक्तियों पर अब बहुपदीय backtracking नहीं; fail-closed व्यवहार अपरिवर्तित।
  - **प्रोटोटाइप-प्रदूषण रक्षा**: नेस्टेड JSON `serverPath` (`openclaw` टारगेट द्वारा प्रयुक्त) लिखने से पहले `__proto__` / `constructor` / `prototype` व गैर-पहचानकर्ता keys अस्वीकार करता है।
  - वैध कॉन्फ़िग हेतु कोई व्यवहार बदलाव नहीं; सत्यापन: `npm test` हरा (आधार **389/389**), `tsc` स्वच्छ, `npm audit` 0 कमज़ोरियाँ।

### v6.4.3

- **Codex टारगेट व डॉक्स सफ़ाई (2026-09-28)**:
  - नया `codex` वन-क्लिक टारगेट: `setup --target codex`, `~/.codex/config.toml` (`[mcp_servers.superpowers]`) में लिखता है; शून्य-निर्भरता TOML मर्ज, `--dry-run` / `--backup` / `--bun` / `--remove` समर्थित।
  - नए `openclaw` / `goose` टारगेट: पहला `~/.openclaw/openclaw.json` (`mcp.servers`) में लिखता है; दूसरा goose के `config.yaml` के `extensions` ब्लॉक में (उपयोगकर्ता के `enabled`/`timeout`/`envs` सुरक्षित)।
  - सेटअप से अतिरिक्त पारदर्शिता TIP हटाया गया (शीर्षक की पुनरावृत्ति); सुरक्षा विवरण Advanced Flags व SECURITY.md में हैं।
  - `docs/desktop-setup.md` अब ChatWise व Cherry Studio हेतु अंग्रेज़ी इम्पोर्ट गाइड है (`setup --print-config`); LM Studio / Roo Code वन-क्लिक तालिका में हैं। पुराना "अप्रकाशित" नोट हटाया गया (`lmstudio`, `roo`, `--print-config` v6.3.9 में जारी)।
  - 7-भाषा README नेविगेशन (नए ES / PT-BR / HI README), ES / PT-BR / HI skill-composition गाइड व CJK बोल्ड-सीमांकक सुधार जारी।
  - MiniMax Code Desktop (मैन्युअल सेटअप) अंकित है (पथ असत्यापित)।
  - सत्यापन: `npm test` हरा, आधार अब 389/389 (+17 setup-target केस), `npm audit` 0 कमज़ोरियाँ।

### v6.4.2

- **v6.4.2 सुरक्षा ऑडिट व कोड समीक्षा (2026-09-24)**: MCP सर्वर, सेटअप स्क्रिप्ट, बिल्ड पाइपलाइन और टेस्ट हार्नेस में ऑडिट निष्कर्ष बंद किए गए (विवरण [SECURITY.md](SECURITY.md) में)।
  - **Traversal व त्रुटि स्वच्छता**: skill नाम allowlist सत्यापन से *पहले* डिकोड किए जाते हैं, इसलिए डबल-एन्कोडेड `..%2f` / `%2e%2e` पेलोड `InvalidParams` से अस्वीकृत होते हैं; अज्ञात tools और prompts अब `MethodNotFound` के बजाय कार्रवाईयोग्य `InvalidParams` त्रुटियाँ लौटाते हैं।
  - **TOCTOU व विनाशकारी-पाथ रक्षा**: symlink जाँच के बाद canonical path पुनः सत्यापित होते हैं, कैश सफ़ाई कॉपी मैनिफ़ेस्ट से नियंत्रित होती है (fork-विशिष्ट skills कभी हटाए नहीं जा सकते), और drift/coverage रिकॉर्ड temp फ़ाइल + rename द्वारा परमाणु रूप से लिखे जाते हैं।
  - **रेस-मुक्त बिल्ड व सॉफ्ट-फ़ेल sync**: `out/setup.js` बिल्ड एक्सक्लूसिव लॉक के साथ mtime ताज़गी पुनः-जाँच लेता है, watch-मोड आउटपुट executable chmod पाता है, और गुम upstream स्रोत झूठा drift उठाने के बजाय साफ़-सुथरे समाप्त होते हैं।
  - **ईमानदार टेस्ट हार्नेस**: ref'd watchdog तथा सर्वर `exit`/`close` हैंडलर मौन hangs समाप्त करते हैं, drift टेस्ट नेटवर्क गार्ड के पीछे चलते हैं, और सीमित-विशेषाधिकार skips अब पास नहीं गिने जाते — रिग्रेशन आधार **365/365** assertions पर बना है।

### v6.4.1

- **Upstream Sync obra/superpowers v6.4.1 तक**:
  - **नेटिव इनलाइन योजना निष्पादन**: पुनर्लिखित `executing-plans` नए `task-start` / `task-done` सहायकों से पूरी योजना चलाता है, फिर एक बार पूरे ब्रांच की समीक्षा — बीच में कोई check-in नहीं।
  - **नई skill: `diagnosing-superpowers`**: डिस्क पर ट्रांसक्रिप्ट से उद्धृत साक्ष्य सहित सत्र फॉरेंसिक, तथा स्क्रब किए गए बंडल और GitHub issue मसौदे (कुल 15 skills)।
  - **समीक्षा व्यवहार**: अनिर्दिष्ट व्यवहार को उचित-उपयोगकर्ता अपेक्षा से आँकें, `Declined to judge` सूची, `BASE_SHA` हेतु `git merge-base origin/main HEAD`।
  - **योजना समीक्षा फ़ोकस**: नया टेम्पलेट अनुभाग और स्व-समीक्षा आइटम, जो spec-निहित edge cases को स्वामी कार्यों से जोड़ते हैं।
  - **नए हार्नेस संदर्भ**: Muse और Claude Code टूल मैपिंग; Devin/OpenCode संदर्भ बनाए रखे गए।
  - स्क्रिप्ट अपने इंटरप्रेटर (`bash` / `node`) से आहूत होते हैं ताकि मार्केटप्लेस पैकेजिंग उन्हें तोड़ न सके।
- **Windows समता व रिग्रेशन आधार**:
  - नए `task-start.ps1` / `task-done.ps1` पोर्ट, sh/ps1 सममिति टेस्ट सूट सहित।
  - सभी अपनाए गए-PR स्थायित्व सामग्री बरकरार (Discoveries बही, समीक्षा-फ़ाइल अनुबंध, greenfield स्क्रिप्ट, remote-सुरक्षा); drift आधार शून्य drift के साथ पुनः दर्ज।
- **व्यापक सुरक्षा ऑडिट व स्वचालित रिग्रेशन आधार** ([`SECURITY.md`](SECURITY.md)):
  - **365 स्वचालित टेस्ट assertions** (Node.js 170, Bash 67, PowerShell 128) में 100% सत्यापित, 0 भेद्यता, 0 hardcoded secrets।
  - इनलाइन `task-done` ऑपरेटर-चुने टेस्ट argv के रूप में चलाता है (`"$@"` / `& $exe @rest`), शेल के रूप में नहीं; बही पाठ केवल प्रदर्शन हेतु।
  - `diagnosing-superpowers` केवल स्थानीय-पठन और निर्यात-नियंत्रित है; redaction सर्वोत्तम-प्रयास है — साझा करने से पहले हर फ़ाइल समीक्षा करें।
  - विलंबित-निष्कर्ष निर्यात में अब समापन-पंक्ति parked गणना से मिलाए बिना `Final: minor (deferred):` शामिल है।
  - स्थानीय Devin कॉन्फ़िग (`.devin/`) gitignored है।

### v6.3.10

- **यूनिवर्सल सेटअप कुंजी संघर्ष समाधान व हानिरहित फ़ील्ड संरक्षण**:
  - मान्य सर्वर कुंजियों (`servers`, `mcp`, `mcpServers`) में मौजूदा घोषणाएँ स्वतः खोजता है, जिससे डुप्लिकेट परस्पर-विरोधी कॉन्फ़िगरेशन रुकते हैं।
  - पुनः-स्थापना पर उपयोगकर्ता-लिखित फ़ील्ड (`env`, `cwd`, `disabled`, `alwaysAllow`, `args`) सुरक्षित मर्ज और संरक्षित करता है।
  - विरोधी फ़्लैगों (`disabled: true` बनाम `enabled: true`) के बीच विरोधाभासी स्थिति समाप्त करता है।
  - अज्ञात फ़्लैग और अप्रत्याशित स्थितीय CLI तर्क exit code 1 से अस्वीकार करता है; Unix pipes पर बिना काटे आउटपुट हेतु `process.exitCode` पर मानकीकृत।
- **Skills कोर इंजन फ़ास्ट-पाथ कैश stat सत्यापन व स्कैन epoch परिरक्षण**:
  - कैश किए skill paths पर फ़ास्ट-पाथ single-stat सत्यापन (`dev`, `ino`, `size`, `mtimeMs`), यदि symlinks पुनर्निर्देशित हों तो पूरे ट्री को पुनः स्कैन किए बिना तुरंत अमान्य करता है।
  - `clearCache()` पर एकदिश बढ़ता `scanEpoch` और `loadingEpoch` रीसेट, जिससे लंबित async स्कैन फ़्लश किए कैश को पुनः न भरें।
  - प्रामाणिक खुला फ़ाइल डिस्क्रिप्टर सत्यापन (`readFileNoFollow`) TOCTOU डिस्क्रिप्टर अदला-बदली रोकता है।
- **MCP Prompt टेम्पलेट मज़बूती व डुप्लीकेशन-रोक**:
  - prompt टेम्पलेट फ़ाइलें गुम या खाली होने पर संरचित stderr निदान सहित `McpError(ErrorCode.InternalError)` से रुकता है।
  - `appliedInterpolations` द्वारा लागू टेम्पलेट प्रतिस्थापन ट्रैक करता है, जिससे अनावश्यक तर्क पुनरावृत्ति रुकती है।
- **व्यापक सुरक्षा ऑडिट व स्वचालित रिग्रेशन आधार**:
  - **292 स्वचालित टेस्ट assertions** (Node.js 163, Bash 35, PowerShell 94) में 100% सत्यापित, 0 भेद्यता, 0 hardcoded secrets।

### v6.3.9

- **स्थायी ReDoS रक्षा (CodeQL Alert #4 समाधान)**:
  - YAML पार्सिंग (`updateYamlConfig`) में अस्पष्ट regex backtracking को अस्पष्टता-रहित prefix कुंजी मिलान और नेटिव `String.prototype.trim()` से बदला।
  - `extractInlineComment` रैखिक स्कैन ($O(N)$) जोड़ा, जिससे लंबे whitespace पैडिंग पर बहुपदीय backtracking रुकता है। CodeQL Alert #4 (`js/polynomial-redos`) औपचारिक रूप से बंद।
  - `tests/setup_test.js` में 60,000 whitespace वर्णों के विरुद्ध रैखिक प्रसंस्करण (<1ms) मान्य करने वाला रिग्रेशन सूट जोड़ा।
- **क्लाइंट सेटअप विस्तार (17 समर्थित AI एजेंट क्लाइंट)**:
  - macOS, Windows और Linux पर **LM Studio** (`lmstudio`, `~/.lmstudio/mcp.json`) और VS Code Desktop में **Roo Code** (`roo`, `rooveterinaryinc.roo-cline/settings/mcp_settings.json`) लक्ष्य जोड़े।
  - `mcp_servers:` और `superpowers:` पर इनलाइन टिप्पणियाँ संरक्षित रखने हेतु YAML कॉन्फ़िगरेशन पार्सर संवर्धित।
- **डेस्कटॉप आयात टूलिंग व Delegation Exit Code अखंडता**:
  - डेस्कटॉप क्लाइंट आयात (ChatWise, Cherry Studio आदि) हेतु फ़ाइलें लिखे बिना स्वच्छ MCP JSON आउटपुट के लिए `setup --print-config` (वैकल्पिक `--bun`) जोड़ा।
  - `src/server.ts` setup delegation को CLI कमांडों से `process.exitCode` संरक्षित रखने हेतु सुदृढ़ किया।
- **डेस्कटॉप सेटअप मार्गदर्शिका**:
  - LM Studio, Roo Code, ChatWise और Cherry Studio सेटअप वाली व्यापक [`docs/desktop-setup.md`](docs/desktop-setup.md) जोड़ी।

👉 *पूर्ण रिलीज़ इतिहास हेतु [CHANGELOG.md](CHANGELOG.md) देखें।*

---

## 🙏 आभार

यह परियोजना [obra](https://github.com/obra) की मूल [Superpowers](https://github.com/obra/superpowers) परियोजना का fork और रूपांतरण है। Agentic skills ढाँचे और सॉफ़्टवेयर विकास पद्धति को परिभाषित करने वाले उनके अग्रणी कार्य के लिए हम आभारी हैं, जो इस MCP सर्वर को शक्ति देता है।
