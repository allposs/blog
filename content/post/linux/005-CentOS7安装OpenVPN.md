---
title:          005-CentOS7安装OpenVPN
date:           2017-02-20T09:20:23+08:00
draft:          true
tags:           [2017-02]
topics:         [OpenVPN,配置安装]
---


## 简介
&#160; &#160; &#160; &#160;OpenVPN是一个用于创建虚拟专用网络(Virtual Private Network)加密通道的免费开源软件。使用OpenVPN可以方便地在家庭、办公场所、住宿酒店等不同网络访问场所之间搭建类似于局域网的专用网络通道。使用OpenVPN配合特定的代理服务器，可用于访问Youtube、FaceBook、Twitter等受限网站，也可用于突破公司的网络限制。
<!--more-->
## 环境

+ 操作系统：CentOS7 1511 X86_64
+ Yum源：163源 
+ IP地址：10.199.200.101
+ DNS：略
+ 主机名：7Node1.example.com

## 软件包##

### 1. Yum源
见部署
### 2. 源码包
无

##拓扑图

无

## 正文

### 1.安装epel源

	[root@7node1 ~]# wget http://dl.fedoraproject.org/pub/epel/7/x86_64/e/epel-release-7-9.noarch.rpm
	[root@7node1 ~]# yum install epel-release-7-9.noarch.rpm

### 2.配置基本

	[root@7node1 ~]# yum install -y openssl-devel pam-devel gcc wget ntp ntpdate easy-rsa bridge-utils openvpn
	[root@7node1 ~]# yum install openvpn easy-rsa-y
	[root@7node1 ~]# systemctl stop firewalld.service
	[root@7node1 ~]# systemctl disable firewalld.service

### 3.配置server.conf

&#160; &#160; &#160; &#160;这里可以从/usr/share/doc/openvpn-*/sample/sample-config-files/client.conf 复制，也可以自己写。

	[root@7node1 ~]# vim /etc/openvpn/server.conf
		port 1194
		proto tcp	# 改成tcp，默认使用udp，如果使用HTTP Proxy，必须使用tcp协议
		dev tun
		ca keys/ca.crt
		cert keys/server.crt
		key keys/server.key  # This file should be kept secret
		dh keys/dh2048.pem
		tls-auth keys/ta.key
		server 10.8.0.0 255.255.255.0	# 默认虚拟局域网网段，不要和实际的局域网冲突即可
		ifconfig-pool-persist ipp.txt
		push "route 10.199.200.0 255.255.255.0"	#是我这台VPN服务器所在的内网的网段，读者应该根据自身实际情况进行修改
		client-to-client	# 可以让客户端之间相互访问直接通过openvpn程序转发，根据需要设置
		duplicate-cn	# 如果客户端都使用相同的证书和密钥连接VPN，一定要打开这个选项，否则每个证书只允许一个人连接VPN
		keepalive 10 120
		comp-lzo
		persist-key
		persist-tun
		status openvpn-status.log
		log-append  openvpn.log
		verb 3	# 改成verb 5可以多查看一些调试信息

### 4.配置证书

	[root@7node1 ~]# cd /etc/openvpn/
	[root@7node1 ~]# cd /usr/share/easy-rsa/2.0/
	# 修改vars文件
	[root@7node1 ~]# vim vars
	# 修改注册信息，比如公司地址、公司名称、部门名称等。
		export KEY_COUNTRY="CN"
		export KEY_PROVINCE="Shanhai"
		export KEY_CITY="QingPu"
		export KEY_ORG="MyOrganization"
		export KEY_EMAIL="me@myhost.mydomain"
		export KEY_OU="MyOrganizationalUnit"

	# 初始化环境变量
	[root@7node1 ~]# source vars
 
	# 清除keys目录下所有与证书相关的文件
	# 下面步骤生成的证书和密钥都在/usr/share/easy-rsa/2.0/keys目录里
	[root@7node1 ~]# ./clean-all
	# 生成根证书ca.crt和根密钥ca.key（一路按回车即可）
	[root@7node1 ~]# ./build-ca
	# 为服务端生成证书和密钥（一路按回车，直到提示需要输入y/n时，输入y再按回车，一共两次）
	[root@7node1 ~]# ./build-key-server server
 
	# 每一个登陆的VPN客户端需要有一个证书，每个证书在同一时刻只能供一个客户端连接，下面建立2份
	# 为客户端生成证书和密钥（一路按回车，直到提示需要输入y/n时，输入y再按回车，一共两次）
	[root@7node1 ~]# ./build-key client1
	[root@7node1 ~]# ./build-key client2
 
	# 创建迪菲·赫尔曼密钥，会生成dh2048.pem文件（生成过程比较慢，在此期间不要去中断它）
	[root@7node1 ~]# ./build-dh
 
	# 生成ta.key文件（防DDos攻击、UDP淹没等恶意攻击）
	[root@7node1 ~]# openvpn --genkey --secret keys/ta.key

	# 在openvpn的配置目录下新建一个keys目录
	[root@7node1 ~]# mkdir /etc/openvpn/keys
	# 将需要用到的openvpn证书和密钥复制一份到刚创建好的keys目录中
	[root@7node1 ~]# cp /usr/share/easy-rsa/2.0/keys/{ca.crt,server.{crt,key},dh2048.pem,ta.key} /etc/openvpn/keys/
	#修改内核转发
	[root@7node1 ~]# vim /etc/sysctl.conf 
		net.ipv4.ip_forward = 1
	[root@7node1 ~]# sysctl -p
	#启动服务
	[root@7node1 ~]# systemctl start openvpn@server
	[root@7node1 ~]# systemctl enable openvpn@server

### 5.windows客户端配置
&#160; &#160; &#160; &#160;安装客户端，这个不用说明了,配置客户端配置信息，目录为安装目录下的conf文件夹。创建一个client.ovpn文件，内容如下：

		client
		dev tun
		proto tcp  #这里用tcp还是udp，根据先前server.conf中的要一致。
		remote 101.221.217.70 53247   # xxx.xxx.xxx.xxx是vpn所在服务器的ip地址
		resolv-retry infinite
		nobind
		persist-key
		persist-tun
		comp-lzo
		verb 3
		ca ca.crt
		cert client1.crt
		key client1.key
		tls-auth ta.key

	并把以ca.crt、client1.crt、client1.key、ta.key文件copy到这个目录，然后用客户端连接。

