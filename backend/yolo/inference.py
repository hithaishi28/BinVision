from binvision.backend.yolo.detector import WasteDetector
from category_mapper import CategoryMapper

def run_inference(image_path):
    detector = WasteDetector("best.pt")
    mapper = CategoryMapper()
    
    raw_detections = detector.detect(image_path)
    final_output = []
    
    for det in raw_detections:
        target_group = mapper.get_category(det["class_id"])
        final_output.append({
            "detected_item": det["class_name"],
            "target_group": target_group,
            "confidence": round(det["confidence"], 2),
            "bbox": [round(c, 2) for c in det["bbox"]]
        })
    return final_output
if __name__ == "__main__":
    import sys
    img = sys.argv[1] if len(sys.argv) > 1 else "test.jpg"
    print(run_inference(img))
