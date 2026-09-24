class CategoryMapper:
    def __init__(self):
        self.mapping = {
            0: "Recyclable",
            1: "Organic",
            2: "Hazardous"
        }

    def get_category(self, class_id):
        return self.mapping.get(class_id, "Unknown")