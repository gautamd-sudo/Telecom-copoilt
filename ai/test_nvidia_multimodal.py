import os
from src.copilot import TelecomCopilot
from src.nvidia_provider import NvidiaProvider

def test_multimodal_copilot():
    copilot = TelecomCopilot("TENANT-123", "USER-456")
    
    # Sample image data url (1x1 pixel or user's base64 style)
    sample_image_url = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    
    # 1. Test query with image_url parameter
    res = copilot.process_message(
        "Describe the path in this image and the landscape around it in two sentences.",
        image_url=sample_image_url
    )
    print("Multimodal Message Response:")
    print(res.model_dump_json(indent=2))
    assert res.message is not None

    # 2. Test query with multimodal content array format (OpenAI / NVIDIA format)
    rich_message = [
        {"type": "text", "text": "Describe the cell tower condition in this telemetry image."},
        {"type": "image_url", "image_url": {"url": sample_image_url}}
    ]
    res2 = copilot.process_message(rich_message)
    print("\nRich Array Multimodal Response:")
    print(res2.model_dump_json(indent=2))
    assert res2.message is not None

if __name__ == "__main__":
    test_multimodal_copilot()
    print("\nMultimodal tests passed successfully!")
