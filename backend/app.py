import os
import requests
import random
import string
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
PINATA_API_KEY = os.getenv('PINATA_API_KEY')
PINATA_SECRET_API_KEY = os.getenv('PINATA_SECRET_API_KEY')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

db = SQLAlchemy(app)

# --- MODELS ---
class ExchangeRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), nullable=False)
    wallet_address = db.Column(db.String(100), nullable=False)
    certificate_id = db.Column(db.String(100), nullable=False)
    image_filename = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='PENDING')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'wallet_address': self.wallet_address,
            'certificate_id': self.certificate_id,
            'image_url': self.image_filename,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

class Voucher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    service_name = db.Column(db.String(100), nullable=False)
    owner_wallet = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    tx_digest = db.Column(db.String(100), unique=True) # Mã giao dịch blockchain
    status = db.Column(db.String(20), default='ACTIVE') # ACTIVE / USED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'service_name': self.service_name,
            'status': self.status,
            'price': self.price,
            'created_at': self.created_at.isoformat()
        }

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def upload_to_pinata(file_obj):
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    headers = { "pinata_api_key": PINATA_API_KEY, "pinata_secret_api_key": PINATA_SECRET_API_KEY }
    files = { 'file': (file_obj.filename, file_obj.read(), file_obj.content_type) }
    try:
        response = requests.post(url, files=files, headers=headers)
        if response.status_code == 200:
            return f"https://gateway.pinata.cloud/ipfs/{response.json()['IpfsHash']}"
        return None
    except: return None

with app.app_context():
    db.create_all()

@app.route('/')
def home(): return "Open-UET Backend Running"

# --- API NỘP MINH CHỨNG ---
@app.route('/api/submit', methods=['POST'])
def submit_request():
    if 'file' not in request.files: return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    if file and allowed_file(file.filename):
        ipfs_url = upload_to_pinata(file)
        if not ipfs_url: return jsonify({'error': 'Upload failed'}), 500
        new_req = ExchangeRequest(
            student_id=request.form.get('studentId'),
            wallet_address=request.form.get('walletAddress'),
            certificate_id=request.form.get('certificateId'),
            image_filename=ipfs_url
        )
        db.session.add(new_req)
        db.session.commit()
        return jsonify({'message': 'Success', 'id': new_req.id}), 201
    return jsonify({'error': 'Invalid file'}), 400

@app.route('/api/admin/requests', methods=['GET'])
def get_requests():
    reqs = ExchangeRequest.query.filter_by(status='PENDING').all()
    return jsonify([r.to_dict() for r in reqs])

@app.route('/api/admin/update-status', methods=['POST'])
def update_status():
    data = request.json
    req = ExchangeRequest.query.get(data.get('id'))
    if req:
        req.status = data.get('status')
        db.session.commit()
        return jsonify({'message': 'Updated'})
    return jsonify({'error': 'Not found'}), 404

# --- API MUA VOUCHER (MỚI) ---
@app.route('/api/buy-voucher', methods=['POST'])
def buy_voucher():
    data = request.json
    # Kiểm tra xem mã giao dịch này đã dùng chưa
    if Voucher.query.filter_by(tx_digest=data.get('tx_digest')).first():
        return jsonify({'error': 'Giao dịch này đã được sử dụng!'}), 400

    code = 'UET-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    voucher = Voucher(
        code=code,
        service_name=data.get('service_name'),
        owner_wallet=data.get('wallet_address'),
        price=data.get('price'),
        tx_digest=data.get('tx_digest')
    )
    db.session.add(voucher)
    db.session.commit()
    return jsonify({'message': 'Thành công', 'voucher': voucher.to_dict()})

# --- API PARTNER CHECK VOUCHER (MỚI) ---
@app.route('/api/partner/verify', methods=['POST'])
def verify_voucher():
    code = request.json.get('code')
    voucher = Voucher.query.filter_by(code=code).first()
    
    if not voucher:
        return jsonify({'valid': False, 'message': 'Mã không tồn tại!'}), 404
    if voucher.status == 'USED':
        return jsonify({'valid': False, 'message': 'Mã đã được sử dụng!'}), 400
    
    voucher.status = 'USED'
    db.session.commit()
    return jsonify({'valid': True, 'message': 'Hợp lệ!', 'service': voucher.service_name})

@app.route('/api/user/vouchers', methods=['GET'])
def get_user_vouchers():
    wallet = request.args.get('wallet') # Lấy địa chỉ ví từ tham số URL
    if not wallet:
        return jsonify([])
    
    # Tìm voucher của ví này, sắp xếp cái mới nhất lên đầu
    vouchers = Voucher.query.filter_by(owner_wallet=wallet).order_by(Voucher.created_at.desc()).all()
    return jsonify([v.to_dict() for v in vouchers])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
