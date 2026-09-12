import os
import asyncio
from dotenv import load_dotenv

from agent_framework.azure import AzureAIAgentClient
from azure.identity.aio import AzureCliCredential

load_dotenv(override=True)

PROMPT = "Tell me a joke about robot pirates."

async def main():
    project_endpoint = os.environ["AZURE_AI_PROJECT_ENDPOINT"]
    agent_name = os.getenv("AZURE_AI_AGENT_NAME", "first-agent")

    async with (
        AzureCliCredential() as credential,
        AzureAIAgentClient(
            credential=credential,
            endpoint=project_endpoint,
        ).create_agent(
            name=agent_name,
            instructions="You are good at telling jokes. You also translate your answers into Spanish.",
        ) as agent,
    ):
        result = await agent.run(PROMPT)
        print(result.text)

if __name__ == "__main__":
    asyncio.run(main()) 
