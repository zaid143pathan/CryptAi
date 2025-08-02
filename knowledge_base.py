import os
from dotenv import load_dotenv
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import Chroma  # Updated import
from langchain_community.document_loaders import TextLoader  # Updated import
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

def load_documents(folder="knowledge"):
    docs = []
    for file in os.listdir(folder):
        if file.endswith(".txt"):
            path = os.path.join(folder, file)
            loader = TextLoader(path)
            docs.extend(loader.load())
    return docs

def create_vectorstore():
    documents = load_documents()
    splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(documents)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=os.getenv("AIzaSyAr2fZkuOZ6zl9BDEMemgBtcqSeGWCXhUM")  # Pass API key here
    )
    vectordb = Chroma.from_documents(
        chunks,
        embedding=embeddings,
        persist_directory="vectordb"
    )
    vectordb.persist()
    return vectordb
