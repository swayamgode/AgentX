
# Guide: Building an LLM that Trains on YouTube Analytics

This guide explains how to build a system that "learns" from your YouTube analytics data to provide tailored content suggestions.

## Concept: "Training" vs "In-Context Learning"

Building a Large Language Model (LLM) from scratch requires massive compute. However, we can "train" an existing powerful model (like Gemini or GPT-4) on your specific data using **In-Context Learning (RAG)** or **Fine-Tuning**.

For this application, we will use a hybrid approach that is instant and runs locally:
1.  **Predictive Modeling (Local)**: We use a statistical model to analyze which variables (Topic, Title Length, Keywords) correlate with high views.
2.  **In-Context Learning (LLM)**: We feed the high-performing patterns into a Gemini 2.0 Flash prompt to generate new video ideas.

## Architecture

```mermaid
graph TD
    A[YouTube Analytics Data] --> B[Data Processor]
    B --> C[Local Regression Model]
    B --> D[Context Builder]
    C --> E[Insights (e.g. 'Love' topic +150% views)]
    D --> F[LLM Prompt Construction]
    E --> F
    F --> G[Gemini API]
    G --> H[Actionable Suggestions]
```

## Step-by-Step Implementation

### Phase 1: Data Collection
*Status: Completed*
Your application already collects data in `.video-analytics.json`, including:
- Video Titles
- Topics
- View Counts
- Engagement Metrics

### Phase 2: The "Brain" (Strategy Engine)
We will create a `StrategyEngine` class that:
1.  **Segments Data**: Separates "Outliers" (Viral hits) from "Underperformers".
2.  **Pattern Recognition**: Identifies common words or topics in high-performing videos.
3.  **Prompt Engineering**: Constructs a prompt like:
    > "Based on this channel history, videos about 'Love' with short titles perform 3x better. Here are the top 5 videos... Generate 5 new titles following this pattern."

### Phase 3: Fine-Tuning (Optional / Advanced)
If you have >500 videos, you can export the data to JSONL format and send it to OpenAI/Google for actual fine-tuning.

**Example JSONL Entry:**
```json
{"messages": [{"role": "system", "content": "You are a YouTube viral strategist."}, {"role": "user", "content": "Suggest a video about heartbreak."}, {"role": "assistant", "content": "Title: 'The Moment You Realize It's Over.' (Predicted Views: 15k based on historical performance)"}]}
```

## How to use the built feature
We have integrated this "Brain" directly into your Analytics Dashboard.
1.  Go to the **Analytics** tab.
2.  Scroll to the **AI Strategy Engine** section.
3.  Click **"Generate Strategy"**.
4.  The system will train on your current data and output a specific plan for your next 5 videos.
