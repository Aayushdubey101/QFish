import os

def get_llm(temperature: float = 0.0):
    """
    Returns an instantiated chat model based on environment variables.
    
    Supported Environment Variables:
    - LLM_PROVIDER: "openai", "anthropic", "google", "openrouter" (default: openai)
    - LLM_MODEL: e.g. "gpt-4o", "claude-3-5-sonnet-20240620", "gemini-1.5-pro", "qwen/qwen-2.5-72b-instruct"
    """
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    model_name = os.getenv("LLM_MODEL", "gpt-4o")
    
    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(model_name=model_name, temperature=temperature)
        
    elif provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model=model_name, temperature=temperature)
        
    elif provider == "openrouter":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"
        )
        
    else: # default to standard OpenAI
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model=model_name, temperature=temperature)
