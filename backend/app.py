import os
import requests  # <-- Thêm thư viện này để gọi API Pinata
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from datetime import datetime
from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- CẤU HÌNH ---
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Lấy Key Pinata từ file .env
PINATA_API_KEY = os.getenv('PINATA_API_KEY')
PINATA_SECRET_API_KEY = os.getenv('PINATA_SECRET_API_KEY')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

db = SQLAlchemy(app)

# --- 1. MODEL DATABASE ---
class ExchangeRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), nullable=False)
    wallet_address = db.Column(db.String(100), nullable=False)
    certificate_id = db.Column(db.String(100), nullable=False)
    
    # Trường này bây giờ sẽ lưu URL đầy đủ từ Pinata (VD: https://gateway.pinata.cloud/ipfs/...)
    image_filename = db.Column(db.String(200), nullable=False)
    
    status = db.Column(db.String(20), default='PENDING')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'wallet_address': self.wallet_address,
            'certificate_id': self.certificate_id,
            'image_url': self.image_filename,  # Trả về trực tiếp URL đã lưu
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

# Hàm kiểm tra đuôi file ảnh
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- HÀM UPLOAD LÊN PINATA ---
def upload_to_pinata(file_obj):
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    
    # Chuẩn bị headers xác thực
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY
    }
    
    # Chuẩn bị file để gửi (file_obj.read() đọc nội dung file từ RAM)
    files = {
        'file': (file_obj.filename, file_obj.read(), file_obj.content_type)
    }

    try:
        response = requests.post(url, files=files, headers=headers)
        if response.status_code == 200:
            ipfs_hash = response.json()['IpfsHash']
            # Trả về đường dẫn xem ảnh công khai qua Gateway
            return f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
        else:
            print("Lỗi Pinata:", response.text)
            return None
    except Exception as e:
        print("Lỗi kết nối Pinata:", e)
        return None

# --- 2. API ENDPOINTS ---

# Khởi tạo Database
with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return "Open-UET Backend is Running (Pinata Integration)!"

# API 1: Sinh viên gửi yêu cầu (Upload ảnh lên Pinata + Lưu DB)
@app.route('/api/submit', methods=['POST'])
def submit_request():
    # Kiểm tra dữ liệu gửi lên
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    student_id = request.form.get('studentId')
    wallet_address = request.form.get('walletAddress')
    certificate_id = request.form.get('certificateId')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        # 1. Upload ảnh lên Pinata
        ipfs_url = upload_to_pinata(file)
        
        if not ipfs_url:
            return jsonify({'error': 'Lỗi upload ảnh lên Pinata. Vui lòng thử lại.'}), 500

        # 2. Lưu thông tin và URL ảnh vào Database
        new_request = ExchangeRequest(
            student_id=student_id,
            wallet_address=wallet_address,
            certificate_id=certificate_id,
            image_filename=ipfs_url  # Lưu full URL IPFS
        )
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify({'message': 'Gửi yêu cầu thành công!', 'id': new_request.id}), 201
    
    return jsonify({'error': 'File type not allowed'}), 400

# API 2: Admin lấy danh sách các đơn đang chờ
@app.route('/api/admin/requests', methods=['GET'])
def get_pending_requests():
    requests = ExchangeRequest.query.filter_by(status='PENDING').all()
    return jsonify([req.to_dict() for req in requests])

# API 3: Admin cập nhật trạng thái
@app.route('/api/admin/update-status', methods=['POST'])
def update_status():
    data = request.json
    request_id = data.get('id')
    new_status = data.get('status')

    req = ExchangeRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    req.status = new_status
    db.session.commit()

    return jsonify({'message': f'Updated request {request_id} to {new_status}'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)