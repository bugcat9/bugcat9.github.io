import re
import requests
import os
from PIL import Image
from io import BytesIO

def download_images_from_md(md_file_path, download_folder):
    # 正则表达式匹配Markdown中的图片链接
    image_url_pattern = re.compile(r'!\[.*?\]\((http.*?)\)')
    
    # 读取Markdown文件
    with open(md_file_path, 'r', encoding='utf-8') as md_file:
        content = md_file.read()
    
    # 查找所有图片链接
    image_urls = image_url_pattern.findall(content)
    
    # 确保下载目录存在
    os.makedirs(download_folder, exist_ok=True)
    
    # 下载每个图片
    for url in image_urls:
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            # 打开图片并转换为PNG
            image = Image.open(BytesIO(response.content))
            image_name = os.path.basename(url)
            image_name_png = os.path.splitext(image_name)[0] + '.png'
            image_path = os.path.join(download_folder, image_name_png)
            
            # 保存图片为PNG格式
            image.save(image_path, 'PNG')
            
            print(f"Downloaded and converted: {image_name_png}")
        except requests.RequestException as e:
            print(f"Failed to download {url}: {e}")

md_file_path = "source\_posts\C++\智能指针.md"
# 获取Markdown文件的名字，不包括扩展名
base_name = os.path.splitext(os.path.basename(md_file_path))[0]
download_folder = base_name
download_images_from_md(md_file_path, download_folder)