---
title:          006-Redhat7.1安装配置PXE服务(HTTP篇)
date:           2016-05-04T11:30:12+08:00
draft:          true
tags:           [2016-05]
topics:         [PXE]
---

## 简介
&#160; &#160; &#160; &#160;PXE(preboot execute environment，预启动执行环境)是由Intel公司开发的最新技术，工作于Client/Server的网络模式，支持工作站通过网络从远端服 务器下载映像，并由此支持通过网络启动操作系统，在启动过程中，终端要求服务器分配IP地址，再用TFTP或MTFTP协议下载一个启动软件包到本机内存中执行，由这个启动软件包完成终端（客户？）基本软件设置，从而引导预先安装在服务器中的终端操作系 统。PXE可以引导多种操作系统，如：Windows95/98/2000/windows2003/windows2008/winXP/win7 /win8,linux等。
工作流程:

+ 1.客户机从自己的PXE网卡启动，向本网络中的DHCP服务器索取IP
+ 2.DHCP服务器返回分给客户机IP以及bootstrap文件的放置位置(该文件一般是放在一台TFTP服务器上)
+ 3.客户机向本网络中的TFTP服务器索取bootstrap文件
+ 4.客户机取得bootstrap文件后之执行该文件
+ 5.根据bootstrap的执行结果，通过TFTP服务器加载内核和文件系统
+ 6.进入安装画面, 此时可以通过选择FTP,HTTP,NFS方式之一进行安装
+ 7.开始安装
<!--more-->

## 环境

+ 操作系统：Redhat7.1 X86_64
+ Yum源：本地yum源
+ IP地址：10.199.255.15
+ DNS：10.199.255.15
+ 主机名：moniter

## 软件包

### 1. Yum源

	[root@moniter ~]# yum -y install ntp ntpdata
	[root@moniter ~]# yum -y install dhcp

### 2. 源码包



## 正文
---
### 1. 安装NTP服务

	[root@moniter ~]# yum -y install ntp ntpdata
	[root@moniter ~]# ntpdate cn.pool.ntp.org
	修改配置NTP服务
	[root@moniter ~]# vim /etc/ntp.conf

修改成如下：


	# For more information about this file, see the man pages
	# ntp.conf(5), ntp_acc(5), ntp_auth(5), ntp_clock(5), ntp_misc(5), ntp_mon(5).

	driftfile /var/lib/ntp/drift
	restrict default ignore 
	#设置默认策略为拒绝所有访问方式的请求

	# Permit time synchronization with our time source, but do not
	# permit the source to query or modify the service on this system.

	restrict default kod nomodify notrap nopeer noquery
	restrict -6 default kod nomodify notrap nopeer noquery

	# Permit all access over the loopback interface. This could
	# be tightened as well, but to do so would effect some of
	# the administrative functions.
	restrict 127.0.0.1
	restrict -6 ::1

	# Hosts on local network are less restricted.
	restrict 10.199.255.0 mask 255.255.255.0 nomodify notrap 
	#允许局域网内机器同步时间

	# Use public servers from the pool.ntp.org project.
	# Please consider joining the pool (http://www.pool.ntp.org/join.html).
	server 210.72.145.44 perfer   # 中国国家受时中心
	server 202.112.10.36             # 1.cn.pool.ntp.org
	server 59.124.196.83             # 0.asia.pool.ntp.org

	#broadcast 192.168.1.255 autokey # broadcast server
	#broadcastclient # broadcast client
	#broadcast 224.0.1.1 autokey # multicast server
	#multicastclient 224.0.1.1 # multicast client
	#manycastserver 239.255.254.254 # manycast server
	#manycastclient 239.255.254.254 autokey # manycast client
	# allow update time by the upper server 

	# 允许上层时间服务器主动修改本机时间
	restrict 210.72.145.44 nomodify notrap noquery
	restrict 202.112.10.36 nomodify notrap noquery
	restrict 59.124.196.83 nomodify notrap noquery

	# Undisciplined Local Clock. This is a fake driver intended for backup
	# and when no outside source of synchronized time is available.
	# 外部时间服务器不可用时，以本地时间作为时间服务
	server  127.127.1.0     # local clock
	fudge   127.127.1.0 stratum 10

	# Enable public key cryptography.
	#crypto

	includefile /etc/ntp/crypto/pw

	# Key file containing the keys and key identifiers used when operating
	# with symmetric key cryptography.
	keys /etc/ntp/keys

	# Specify the key identifiers which are trusted.
	#trustedkey 4 8 42

	# Specify the key identifier to use with the ntpdc utility.
	#requestkey 8

	# Specify the key identifier to use with the ntpq utility.
	#controlkey 8

	# Enable writing of statistics records.
	#statistics clockstats cryptostats loops

   
### 2. 安装配置DHCP服务

	[root@moniter ~]# yum -y install dhcp
	编辑配置文件
	[root@moniter ~]# vim /etc/dhcp/dhcpd.conf 

编辑成如下：

	ddns-update-style none;
	default-lease-time 21600;
	max-lease-time  43200;
	option  domain-name     "allposs.com";
	option  domain-name-servers 10.199.255.1;

	subnet 10.199.255.0 netmask 255.255.255.0{
	range 10.199.255.150 10.199.255.200;
	option subnet-mask 255.255.255.0;
	option routers 10.199.255.1;
	next-server	10.199.255.15;	#pxe服务器地址
	filename		“pxelinux.0”;

	}

配置文件详解：
全局设置：
通常我们把subnet 10.199.255.0 netmask 255.255.255.0（不包括subnet这行内容） 以上的内容成为全局。
各行含义如下：

	ddns-update-style interim;  #表示dhcp服务器和dns服务器的动态信息更新模式。这行必须要有dhcp服务器才能启动以来。
	Default-lease-time 21600； #默认租约时间
	Max-lease-time 43200; #最大租约时间
	Option domain-name "allposs.com"; #域名服务器的名称
	Option domaini-servers 10.199.255.254  #默认域名服务的ip地址
	Sub 后从“{”开始 到最后一个“}”结束表示子网属性。其主要配置只对大括号里的内容有效。一个配置文件可以有多个子网属性。
	Sub 10.199.255.0 netmask 255.255.255.0 ;  #意思是我所分配的ip地址所在的网段为10.199.255.0 子网掩码为255.255.255.0
	Range 10.199.255.150 10.199.255.200;  #分配的ip地址范围为10.199.255.150到10.199.255.200
	Option subnet-mask 255.255.255.0 ;  #分配ip地址的子网掩码为 255.255.255.0
	Option routers 10.199.255.1;  #分给客户机的网关为10.199.255.1
	有时候我们需要为某一个机器配置固定的ip地址，而下面的配置选项满足了这一要求：
		Host server01 {
			Hardware ethernet b0:c0:12:f2:a3:a4;
			Fixed-address 10.199.255.100;
		}
	具体含义和简单意思是“我们给客户机mac地址为b0;c0;12;f2;a3;a4所配置的ip地址为10.199.255.100”。

### 3. 安装TFTP服务

	[root@moniter ~]# yum install tftp*
	编译配置文件
	[root@moniter ~]# vim /etc/xinetd.d/tftp

编辑成如下内容：

	# default: off
	# description: The tftp server serves files using the trivial file transfer \
	#       protocol.  The tftp protocol is often used to boot diskless \
	#       workstations, download configuration files to network-aware printers, \
	#       and to start the installation process for some operating systems.
	service tftp
	{
        socket_type             = dgram
        protocol                = udp
        wait                    = yes
        user                    = root
        server                  = /usr/sbin/in.tftpd
        server_args             = -s  /data/pxe 	
	#修改为自己认定的根目录，并让nobody用户登陆
	#修改tftp根目录，selinux默认策略会阻止导致无法登陆。
        disable                 = no	
	#默认为yes,改为NO
        per_source              = 11
        cps                     = 100 2
        flags                   = IPv4
	}

 
### 4. 安装配置httpd
### 4.1 安装httpd

	[root@moniter ~]# mkdir -p /data/http/pxe/
	[root@moniter ~]# mkdir -p /data/http/logs/
	[root@moniter ~]# yum install httpd

### 4.2 配置httpd

	[root@moniter ~]# vim /etc/httpd/conf.d/vrt.conf

内容如下

	<Virtualhost *:80>
	ServerName pxe.allposs.com
	DocumentRoot  "/data/http/pxe"
	DirectoryIndex index.php index.html
	<Directory "/data/http/pxe">
 	Options Indexes FollowSymLinks
 	IndexOptions NameWidth=25 Charset=UTF-8
 	AllowOverride None
	# Order allow,deny
	# Allow from all
 	Require all granted
	</Directory>
	LogFormat "%h %l %u %t \"%r\" %>s %b" common
	errorlog /data/http/logs/pxe_error_log.log
	CustomLog /data/http/logs/pxe_access_log.log common
	</VirtUalHost>

### 5. PXE相关配置

	[root@moniter ~]# yum install syslinux
	[root@moniter ~]# mkdir -p /data/pxe/pxelinux.cfg
	[root@moniter ~]# mkdir /data/pxe/redhat7.1
	[root@moniter ~]# cp /usr/share/syslinux/pxelinux.0 /data/pxe/
	[root@moniter ~]# mount /dev/cdrom /mnt/
	[root@moniter ~]# cp /mnt/images/pxeboot/initrd.img /data/pxe/redhat7.1
	[root@moniter ~]# cp /mnt/images/pxeboot/vmlinuz /data/pxe/redhat7.1
	[root@moniter ~]# cp /mnt/isolinux/vesamenu.c32 /data/pxe/redhat7.1
	[root@moniter ~]# cp /data/http/pxe/RedHat/7.1/isolinux/*.msg /data/pxe/

编辑pxe启动选项

	[root@moniter pxe]# vim pxelinux.cfg/default 

内容如下

	default vesamenu.c32
	timeout 600
	display boot.msg
	menu clear
	default vesamenu.c32
	timeout 600
	display boot.msg
	menu clear
	menu background splash.png
	menu title Red Hat Enterprise Linux 7.1
	menu vshift 8
	menu rows 18
	menu margin 8
	menu helpmsgrow 15
	menu tabmsgrow 13
	menu color border * #00000000 #00000000 none
	menu color sel 0 #ffffffff #00000000 none
	menu color title 0 #ff7ba3d0 #00000000 none
	menu color unsel 0 #84b8ffff #00000000 none
	menu color hotsel 0 #84b8ffff #00000000 none
	menu color hotkey 0 #ffffffff #00000000 none
	menu color help 0 #ffffffff #00000000 none
	menu color scrollbar 0 #ffffffff #ff355594 none
	menu color timeout 0 #ffffffff #00000000 none
	menu color timeout_msg 0 #ffffffff #00000000 none
	menu color cmdmark 0 #84b8ffff #00000000 none
	menu color cmdline 0 #ffffffff #00000000 none

	label Redhat7.1
  		menu label Kickstart  ^RedHat7.1
  		menu default
  		kernel redhat/vmlinuz
  		append initrd=redhat7.1/initrd.img  ks=http://pxe.allposs.com/ks/RedHat7.1.cfg
	label CenOS6.5
  		menu label Kickstart ^CentOS6.5
  		kernel CentOS6.5/vmlinuz
  		append initrd=CentOS6.5/initrd.img ks=http://pxe.allposs.com/ks/CentOS6.5.cfg
	label web
  		menu label Kickstart ^web Server
  		kernel CentOS6.5/vmlinuz
  		append initrd=CentOS6.5/initrd.img ks=http://pxe.allposs.com/ks/web.cfg
	label custom
  		menu label Use ^custom kickstart configuration(Press [tab])
  		kernel vmlinuz
  		append initrd=initrd.img ks=
	label local
  		menu label Boot from ^local drive
  		localboot 0xffff

## 6. 配置服务启动

启动NTP服务

	[root@moniter ~]# systemctl enable ntpd.service	
	[root@moniter ~]# systemctl start ntpd.service	

启动tftp服务

	[root@moniter pxe]# systemctl start xinetd.service

启动http服务

	[root@moniter pxe]# systemctl enable httpd.service
	[root@moniter pxe]# systemctl start httpd.service

启动DHCP服务

	[root@moniter ~]# systemctl enable dhcpd.service
	[root@moniter ~]# systemctl start dhcpd.service

配置防火墙

	[root@moniter ~]# firewall-cmd --permanent --add-service=ntp
	[root@moniter ~]# firewall-cmd --permanent --add-service=http
	[root@moniter ~]# firewall-cmd --permanent --add-service=dhcp
	[root@moniter ~]# firewall-cmd --permanent --add-service=tftp
	[root@moniter ~]# firewall-cmd –reload

配置selinux

	[root@moniter ~]# chcon –u system_u –t ftftpdir_rw_t /data/pxe
	[root@moniter ~]# setsebool -P tftp_home_dir=on
	[root@moniter ~]# chcon –t http_rw_t /data/http/pxe

制作ks.cfg文件并拷贝redhat7.1安装光盘到/data/http/pxe/redhat/7.1/
然后测试一下，如果可以安装则通过，ks.cfg文件制作需要用到kickstart，安装的进修要

---
## 结束
注：
1.首先要配置个本地yum源，要不然用system-config-kickstart时选不上包。
而且，yum 源的名字一定是[base],要不然会报:
Package selection is disabled due to problems downloading package information.
2.system-config-kickstart暂时不兼容redhat7系列