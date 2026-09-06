from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os

# 设置镜像站
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

# 模型名称
model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
# 本地保存路径
local_model_path = "./models/twitter-roberta-sentiment"

print(f"正在从镜像站下载模型 {model_name} ...")


tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

tokenizer.save_pretrained(local_model_path)
model.save_pretrained(local_model_path)
print(f"模型已成功保存到: {local_model_path}")