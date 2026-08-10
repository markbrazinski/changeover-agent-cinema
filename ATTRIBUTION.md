# Attribution & Media Credits

Changeover uses open-source media assets and third-party libraries. All media excerpts, transcriptions, and software dependencies are used in accordance with their respective open-source licenses.

---

## 🎬 Open-Source Film Assets

The broadcast simulation video streams and subtitle sidecars in `films/` are derived from open-movie projects produced by the **Blender Foundation**:

### 1. **Tears of Steel** (Channel 14 / Primary Demonstration)
- **Producer**: Blender Foundation (2012)
- **License**: Creative Commons Attribution 3.0 Unported ([CC BY 3.0](https://creativecommons.org/licenses/by/3.0/))
- **Source**: [https://mango.blender.org/](https://mango.blender.org/)
- **Modifications**: Excerpted MP4 video clips (`source.mp4`, `backup.mp4`) and ASR-derived WebVTT subtitle sidecars (`captions.vtt`).

### 2. **Sintel** (Channel 27 / Contention Scenario)
- **Producer**: Blender Foundation (2010)
- **License**: Creative Commons Attribution 3.0 Unported ([CC BY 3.0](https://creativecommons.org/licenses/by/3.0/))
- **Source**: [https://durian.blender.org/](https://durian.blender.org/)
- **Modifications**: Excerpted MP4 video clips (`source.mp4`, `backup.mp4`) and ASR-derived WebVTT subtitle sidecars (`captions.vtt`).

---

## 🛠️ Third-Party Open Source Software

Changeover relies on the following open-source frameworks and libraries:

- **Google GenAI SDK (`google-genai`)**: Next-generation Python client for Google Gemini APIs (Apache 2.0).
- **Grafana Cloud & PromQL**: Observability proxy & Prometheus querying engine.
- **Model Context Protocol (MCP)**: Open agent-tool integration specification.
- **OpenAI Whisper**: Speech recognition model used offline for ground-truth subtitle alignment (MIT).
- **FFmpeg / FFprobe**: Open-source multimedia inspection toolchain (LGPL v2.1+ / GPL v2+).
- **FastAPI & Uvicorn**: Python ASGI web framework (MIT).
- **React 18 & TypeScript**: Frontend application runtime and type system (MIT).
- **Vite 5**: Next-gen frontend tooling and dev server (MIT).
- **Playwright**: End-to-end browser testing and automation framework (Apache 2.0).
- **Pytest**: Python unit and integration testing framework (MIT).
- **Lucide React**: Open-source UI iconography (ISC).
