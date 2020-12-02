# -*- coding:utf-8 -*-
# Copyright 2018 Huawei Technologies Co.,Ltd.
# 
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use
# this file except in compliance with the License.  You may obtain a copy of the
# License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software distributed
# under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations under the License.

# C:\Users\xczx0627\AppData\Local\Programs\Python\Python36\scripts\pyinstaller -F E:\MyPython\huaweicloud\cdn.py
import sys
import os
import re
from openstack import connection
os.environ.setdefault('OS_CDN_ENDPOINT_OVERRIDE','https://cdn.myhuaweicloud.com/v1.0/')  # CDN API url,example:https://cdn.myhuaweicloud.com/v1.0/

# AKSK Auth=======================
# projectId = "xxxxxxxxxxx"  # Project ID of cn-north-1
# cloud = "xxxxxxxxxxx"  # cdn use: cloud = "myhuaweicloud.com"
# region = "xxxxxxxxxxx"  # example: region = "cn-north-1"
# AK = "xxxxxxxxxxx"
# SK = "xxxxxxxxxxx"
# conn = connection.Connection(
#     project_id=projectId,
#     cloud=cloud,
#     region=region,
#     ak=AK,
#     sk=SK
# )

'''
projectId = "cn-north-1"  # Project ID of cn-north-1
cloud = "myhuaweicloud.com"  # cdn use: cloud = "myhuaweicloud.com"
region = "cn-north-1"  # example: region = "cn-north-1"
AK = "DRNBEBBCVY30P0FULINB"
SK = "s73VGPC6OaztuO40uKb5DpDsUXFR3RP7PJmcr2wb"

conn = connection.Connection(
    project_id=projectId,
    cloud=cloud,
    region=region,
    ak=AK,
    sk=SK)
'''

# token ============================
# Authusername = "replace-with-your-username"    #用户名称
# password = "replace-with-your-password"    #用户密码
# projectId = "replace-with-your-projectId"    #项目ID
# userDomainId = "replace-with-your-domainId"  #账户ID
# auth_url = "https://iam.example.com/v3"    # endpoint url
# conn = connection.Connection(
#      auth_url=auth_url,
#      user_domain_id=userDomainId,
#      project_id=projectId,
#      username=username,
#      password=password
#  )

username = "xczxcdnapi"  # IAM User Name
password = "Xczx4VKcW3pFgc"  # IAM User Password
projectId = "099eaa2c6500256c2f24c008eaa09045"  # Project ID of cn-north-1
userDomainId = "092ac987a800f5b80fdac008a9a05080"  # Account ID
auth_url = "https://iam.myhuaweicloud.com/v3"  # IAM auth url,example: https://iam.myhuaweicloud.com/v3
conn = connection.Connection(
     auth_url=auth_url,
     user_domain_id=userDomainId,
     project_id=projectId,
     username=username,
     password=password
 )
 
# new version API
# part 3: Refreshing and Preheating
# Creating a Cache Refreshing Task
def refresh_create(_refresh_task):
    print("refresh files or dirs:")
    task = conn.cdn.create_refresh_task(**_refresh_task)
    print(task)

'''
if __name__ == "__main__":
    # new version API
    # part 3: Refreshing and Preheating
    # Creating a Cache Refreshing Task
    refresh_file_task = {
        "type": "file",
        "urls": ["https://appjs.changsha.cn/front_js/Mypublish.js",
                 "https://appjs.changsha.cn/front_js/Mypublish.js"]
    }
    refresh_dir_task = {
        "type": "directory",
        "urls": ["xxxxxxxxxxx",
                 "xxxxxxxxxxx"]
    }
'''
# 获取输入参数
def GetPara(index):
    if sys.argv.__len__()>index:
        para=sys.argv[index];
    else:
        para=None;
    return para;

# 程序路径
def GetPath():
    path=GetPara(0);
    if path.rindex("\\") > 0:path=path[0:path.rindex("\\")+1];
    if path.rindex("/") > 0:path=path[0:path.rindex("/")+1];
    return path;

# 正则替换
def RegReplace(regstr,repalcestr,searchstr):
    result= re.sub(regstr,repalcestr,searchstr,0,re.I);
    return result;

# 获取url,url;
def GetUrl():
    urllist=GetPara(2);
    urlary=[];
    if not(urllist is None):
        if urllist!="":
            urllist=RegReplace("\s*[\r\n]+\s*",",",urllist);
            urlary=urllist.split(",");
    return urlary;

# 获取更新类型
type=GetPara(1);

# 更新文件
if type=="file":
    url=GetUrl();
    if url.__len__()>0:
        refresh_file_task = {
            "type": "file",
            "urls": url
        }
        refresh_create(refresh_file_task);

# 更新目录
if type=="directory":
    url=GetUrl();
    if url.__len__()>0:
        refresh_dir_task = {
            "type": "directory",
            "urls": url
        }
        refresh_create(refresh_dir_task);
