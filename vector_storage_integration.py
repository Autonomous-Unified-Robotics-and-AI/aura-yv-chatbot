#!/usr/bin/env python3
"""
Vector Storage Integration for Aura Vercel Chatbot

This module provides easy integration of the dual vector storage system
with your existing Vercel chatbot application.
"""

import os
import sys
from pathlib import Path
from typing import List, Optional

# Add aura_rag to path - adjust this path based on your project structure
sys.path.append(str(Path(__file__).parent.parent / "aura_rag" / "src"))

try:
    from aura_rag.data_processing.vector_store import ModularVectorStore
    from aura_rag.data_processing.config import VectorStoreConfig, StorageBackend, ProcessingPresets
    from llama_index.core.schema import TextNode
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure aura_rag is properly installed or adjust the path above")
    sys.exit(1)


class AuraChatbotVectorStore:
    """
    Vector storage wrapper for Aura Chatbot with Vercel KV integration
    """
    
    def __init__(self, use_dual_storage: bool = True):
        """
        Initialize vector store with optimal configuration for Vercel deployment
        
        Args:
            use_dual_storage: If True, uses local + Vercel KV. If False, Vercel KV only.
        """
        self.use_dual_storage = use_dual_storage
        self.vector_store = None
        self._initialize_storage()
    
    def _initialize_storage(self):
        """Initialize the vector storage based on environment"""
        try:
            if self.use_dual_storage:
                # Dual storage for development/production hybrid
                config = self._get_dual_storage_config()
            else:
                # Vercel KV only for pure serverless
                config = self._get_vercel_config()
            
            self.vector_store = ModularVectorStore(config)
            print(f"✅ Vector store initialized with {config.storage_backend.value} backend")
            
        except Exception as e:
            print(f"❌ Failed to initialize vector store: {e}")
            # Fallback to local storage
            self._fallback_to_local()
    
    def _get_dual_storage_config(self) -> VectorStoreConfig:
        """Get dual storage configuration"""
        # Use the preset configuration and customize for chatbot
        pipeline_config = ProcessingPresets.for_vercel_dual_storage()
        vector_config = pipeline_config.vector_store_config
        
        # Override with environment variables if available
        vector_config.vercel_kv_url = os.getenv("KV_URL")
        vector_config.vercel_kv_token = os.getenv("KV_REST_API_TOKEN")
        vector_config.store_name = "aura_chatbot_store"
        
        return vector_config
    
    def _get_vercel_config(self) -> VectorStoreConfig:
        """Get Vercel KV only configuration"""
        pipeline_config = ProcessingPresets.for_vercel_deployment()
        vector_config = pipeline_config.vector_store_config
        
        vector_config.vercel_kv_url = os.getenv("KV_URL")
        vector_config.vercel_kv_token = os.getenv("KV_REST_API_TOKEN")
        vector_config.store_name = "aura_chatbot_store"
        
        if not vector_config.vercel_kv_url or not vector_config.vercel_kv_token:
            raise ValueError("Vercel KV credentials required. Set KV_URL and KV_REST_API_TOKEN")
        
        return vector_config
    
    def _fallback_to_local(self):
        """Fallback to local storage if Vercel KV fails"""
        print("🔄 Falling back to local storage...")
        config = VectorStoreConfig(
            storage_backend=StorageBackend.LOCAL,
            storage_path="./vector_stores",
            store_name="aura_chatbot_store_local",
            auto_save=True,
            auto_load=True
        )
        self.vector_store = ModularVectorStore(config)
        print("✅ Local vector store initialized")
    
    def add_documents(self, documents: List[dict]) -> bool:
        """
        Add documents to the vector store
        
        Args:
            documents: List of dictionaries with 'text' and optional 'metadata'
                      e.g., [{"text": "content", "metadata": {"source": "doc1"}}]
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.vector_store:
            print("❌ Vector store not initialized")
            return False
        
        try:
            # Convert documents to TextNode objects
            nodes = []
            for doc in documents:
                node = TextNode(
                    text=doc['text'],
                    metadata=doc.get('metadata', {})
                )
                # Note: You'll need to generate embeddings for the nodes
                # This is typically done by your embedding service
                nodes.append(node)
            
            # Add nodes to vector store
            result = self.vector_store.add_nodes(nodes)
            if result.success:
                print(f"✅ Added {len(nodes)} documents to vector store")
                return True
            else:
                print(f"❌ Failed to add documents: {result.message}")
                return False
                
        except Exception as e:
            print(f"❌ Error adding documents: {e}")
            return False
    
    def search(self, query_embedding: List[float], top_k: int = 5) -> List[dict]:
        """
        Search for similar documents
        
        Args:
            query_embedding: The query embedding vector
            top_k: Number of results to return
        
        Returns:
            List of dictionaries with search results
        """
        if not self.vector_store:
            print("❌ Vector store not initialized")
            return []
        
        try:
            result = self.vector_store.query(query_embedding, top_k=top_k)
            
            # Convert results to simple dictionaries
            search_results = []
            for node_with_score in result.nodes:
                search_results.append({
                    'text': node_with_score.node.text,
                    'metadata': node_with_score.node.metadata,
                    'score': node_with_score.score
                })
            
            return search_results
            
        except Exception as e:
            print(f"❌ Search error: {e}")
            return []
    
    def get_stats(self) -> dict:
        """Get vector store statistics"""
        if not self.vector_store:
            return {"error": "Vector store not initialized"}
        
        try:
            return self.vector_store.get_stats()
        except Exception as e:
            return {"error": str(e)}
    
    def force_sync(self) -> bool:
        """Force synchronization between local and Vercel KV storage"""
        if not self.vector_store:
            return False
        
        try:
            result = self.vector_store.save()
            return result.success
        except Exception as e:
            print(f"❌ Sync error: {e}")
            return False


# Convenience functions for easy integration

def init_chatbot_vector_store(dual_storage: bool = True) -> AuraChatbotVectorStore:
    """
    Initialize vector store for chatbot use
    
    Args:
        dual_storage: Whether to use dual storage (local + Vercel KV)
    
    Returns:
        AuraChatbotVectorStore instance
    """
    return AuraChatbotVectorStore(use_dual_storage=dual_storage)


def setup_vercel_environment():
    """
    Setup guide for Vercel environment variables
    """
    print("🔧 Vercel Environment Setup")
    print("=" * 30)
    print("Add these environment variables to your Vercel project:")
    print("")
    print("1. KV_URL - Your Vercel KV database URL")
    print("2. KV_REST_API_TOKEN - Your Vercel KV REST API token")
    print("")
    print("You can find these in your Vercel dashboard under:")
    print("Project Settings > Storage > Your KV Database")
    print("")
    print("For local development, add them to your .env file:")
    print("KV_URL=your_kv_url_here")
    print("KV_REST_API_TOKEN=your_token_here")


if __name__ == "__main__":
    print("Aura Chatbot Vector Storage Integration")
    print("=" * 40)
    
    # Initialize vector store
    vector_store = init_chatbot_vector_store(dual_storage=True)
    
    # Show stats
    stats = vector_store.get_stats()
    print(f"\n📊 Vector Store Stats: {stats}")
    
    # Show setup instructions
    print("\n")
    setup_vercel_environment()
    
    print("\n🚀 Integration ready!")
    print("Import this module in your chatbot code:")
    print("from vector_storage_integration import init_chatbot_vector_store")