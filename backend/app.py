import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from datetime import datetime
from dotenv import load_dotenv  # <-- 1. Import thư viện này

# 2. Load biến môi trường từ file .env
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# 3. Lấy cấu hình từ biến môi trường (os.getenv)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Tạo thư mục uploads nếu chưa có
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

db = SQLAlchemy(app)

# --- 1. MODEL DATABASE (Bảng lưu yêu cầu đổi điểm) ---
class ExchangeRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), nullable=False)
    wallet_address = db.Column(db.String(100), nullable=False)
    certificate_id = db.Column(db.String(100), nullable=False)
    image_filename = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='PENDING') # PENDING, APPROVED, REJECTED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Sau này nếu bạn làm AI, bạn sẽ thêm trường:
    # ai_verified = db.Column(db.Boolean, default=False)
    # ocr_data = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'wallet_address': self.wallet_address,
            'certificate_id': self.certificate_id,
            'image_url': f"http://localhost:5000/uploads/{self.image_filename}",
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

# Hàm kiểm tra đuôi file ảnh
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- 2. API ENDPOINTS ---

# Khởi tạo Database
with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return "Open-UET Backend is Running!"

# API 1: Sinh viên gửi yêu cầu (Upload ảnh + Thông tin)
@app.route('/api/submit', methods=['POST'])
def submit_request():
    # Kiểm tra dữ liệu gửi lên
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    student_id = request.form.get('studentId')
    wallet_address = request.form.get('walletAddress') # Lấy từ ví SUI user đang connect
    certificate_id = request.form.get('certificateId')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        # Lưu file an toàn
        filename = secure_filename(f"{student_id}_{int(datetime.now().timestamp())}_{file.filename}")
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

        # Lưu vào Database
        new_request = ExchangeRequest(
            student_id=student_id,
            wallet_address=wallet_address,
            certificate_id=certificate_id,
            image_filename=filename
        )
        db.session.add(new_request)
        db.session.commit()

        # TODO: Tại đây bạn có thể gọi hàm AI OCR để đọc ảnh ngay lập tức
        
        return jsonify({'message': 'Gửi yêu cầu thành công!', 'id': new_request.id}), 201
    
    return jsonify({'error': 'File type not allowed'}), 400

# API 2: Admin lấy danh sách các đơn đang chờ (PENDING)
@app.route('/api/admin/requests', methods=['GET'])
def get_pending_requests():
    # Lọc các đơn có status là PENDING
    requests = ExchangeRequest.query.filter_by(status='PENDING').all()
    return jsonify([req.to_dict() for req in requests])

# API 3: Admin cập nhật trạng thái (Duyệt/Từ chối)
@app.route('/api/admin/update-status', methods=['POST'])
def update_status():
    data = request.json
    request_id = data.get('id')
    new_status = data.get('status') # 'APPROVED' hoặc 'REJECTED'

    req = ExchangeRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    req.status = new_status
    db.session.commit()

    return jsonify({'message': f'Updated request {request_id} to {new_status}'})

# API phụ: Serve ảnh để Frontend hiển thị
from flask import send_from_directory
@app.route('/uploads/<name>')
def download_file(name):
    return send_from_directory(app.config['UPLOAD_FOLDER'], name)

if __name__ == '__main__':
    app.run(debug=True, port=5000)