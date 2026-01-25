import face_recognition
import numpy as np
import os

# Placeholder for Known Faces Database
# In real app, load from DB or folder
KNOWN_FACES_DIR = "known_faces"

class FaceAuthSystem:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_names = []
        # self.load_known_faces() # Uncomment to load real faces

    def load_known_faces(self):
        if not os.path.exists(KNOWN_FACES_DIR):
            os.makedirs(KNOWN_FACES_DIR)
            return

        for filename in os.listdir(KNOWN_FACES_DIR):
            image = face_recognition.load_image_file(f"{KNOWN_FACES_DIR}/{filename}")
            encoding = face_recognition.face_encodings(image)[0]
            self.known_face_encodings.append(encoding)
            self.known_face_names.append(os.path.splitext(filename)[0])

    def verify_face(self, frame_image, user_id):
        """
        frame_image: numpy array (image from camera)
        user_id: ID to match against (optional, or match against all)
        """
        # Find faces in frame
        face_locations = face_recognition.face_locations(frame_image)
        face_encodings = face_recognition.face_encodings(frame_image, face_locations)

        for face_encoding in face_encodings:
            # See if the face is a match for the known face(s)
            matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
            name = "Unknown"

            if True in matches:
                first_match_index = matches.index(True)
                name = self.known_face_names[first_match_index]
                if user_id and name == user_id:
                    return True
        
        return False

# Export instance
face_auth = FaceAuthSystem()
