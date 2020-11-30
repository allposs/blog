---
title:          002-Ubuntu安装CRI-O
date:           2020-09-16T14:20:23+08:00
draft:          true
tags:           [2020-09]
topics:         [Ubuntu,CRI-O]
---
## 简介
 
&nbsp;&nbsp;&nbsp;&nbsp;最近在研究容器的相关技术,有时候需要安装配置一些容器的组件,这篇文章主要讲在Ubuntu 20.04版本下安装CRI-O的容器运行时组件。
 
<!--more-->
## 环境
 
    系统：Ubuntu 20.04
 
## 软件包
 
无
 
## 拓扑图
 
无
 
## 正文
---
 
 ### 1.更新系统（可选）

    $ sudo apt update && sudo apt upgrade
    $ sudo systemctl reboot

### 2.配置Ubuntu仓库

    #设置CRI-O版本
    $ CRIO_VERSION=1.17
    $ . /etc/os-release
    #配置安装源
    $ sudo sh -c "echo 'deb http://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/x${NAME}_${VERSION_ID}/ /' >/etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list"
    $ 安装gpg密钥
    $ wget -nv https://download.opensuse.org/repositories/devel:kubic:libcontainers:stable/x${NAME}_${VERSION_ID}/Release.key -O- | sudo apt-key add -

### 3. 安装CRI-O

    #安装CRI-O
    $ sudo apt update
    $ sudo apt install cri-o-${CRIO_VERSION}

### 4. 启动验证CRI-O

    $ sudo systemctl enable crio.service
    $ sudo systemctl start crio.service
    $ systemctl status crio
    #安装CRI-O工具
    $ sudo apt install cri-tools
    #查看CRI-O信息
    $ crictl info
---
## 结束