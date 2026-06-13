# Live2D Models

Thư mục này chứa các model Live2D cho avatar AI.

## Cài đặt Model

### Hiyori (Mặc định)
1. Tải model Hiyori từ [Live2D Sample Models](https://www.live2d.com/en/download/sample-data/)
2. Giải nén và copy vào `public/live2d/hiyori/`
3. Đảm bảo có file `hiyori_pro_t10.model3.json`

### Custom Model
Bạn có thể thêm model riêng:
1. Tạo folder mới trong `public/live2d/`
2. Copy tất cả file model (`.model3.json`, `.moc3`, textures...)
3. Cập nhật đường dẫn trong component

## Cấu trúc thư mục

```
public/live2d/
├── hiyori/
│   ├── hiyori_pro_t10.model3.json
│   ├── hiyori_pro_t10.moc3
│   ├── hiyori_pro_t10.physics3.json
│   ├── motions/
│   │   ├── hiyori_m01.motion3.json
│   │   └── ...
│   └── textures/
│       └── ...
└── README.md
```

## Tải model miễn phí

1. **Live2D Sample Models**: https://www.live2d.com/en/download/sample-data/
2. **Booth.pm**: Nhiều model miễn phí và trả phí
3. **VRoid Hub**: Có thể convert từ VRM sang Live2D

## Lưu ý License

- Sample models của Live2D chỉ dùng cho mục đích học tập
- Kiểm tra license trước khi sử dụng thương mại
- Một số model yêu cầu credit tác giả
