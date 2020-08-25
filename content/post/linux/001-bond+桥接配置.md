---
title:          001-bond+桥接配置
date:           2016-05-17T14:20:23+08:00
draft:          true
tags:           [2016-05]
topics:         [Linux,Bond,Team]
---

## 简介
&#160; &#160; &#160; &#160;Centos7版本下网卡的bond与team配置。
<!--more-->
## 环境

+ 操作系统：CentOS7+，redhat7+,CentOS6+,redhat6+
+ Yum源：163源
+ IP地址：-
+ DNS：-
+ 主机名：-

## 软件包

无

## 拓扑图

无

## 正文
---
说明：

&#160; &#160; &#160; &#160;本机有4个普通千兆网卡和2个光纤网卡，分别是em1-4和p6p1-2
预想em1-2做bond1,em3-4做bond2,p6p1-2做bond3，bond1与bond2做桥接，桥接名为br0，bond3单独,bond模式为4，也就是802.3ad，动态链接聚合


下面这是bond的7种模式：


	=0： (balance-rr) Round-robin policy: （平衡抡循环策略）：传输数据包顺序是依次传输，直到最后一个传输完毕， 此模式提供负载平衡和容错能力。

	=1： (active-backup) Active-backup policy:（主-备份策略）：只有一个设备处于活动状态。 一个宕掉另一个马上由备份转换为主设备。mac地址是外部可见得。 此模式提供了容错能力。

	=2：(balance-xor) XOR policy:（广播策略）：将所有数据包传输给所有接口。 此模式提供了容错能力。

	=3：(balance-xor) XOR policy:（平衡策略）： 传输根据原地址布尔值选择传输设备。 此模式提供负载平衡和容错能力。

	=4：(802.3ad) IEEE 802.3ad Dynamic link aggregation.IEEE 802.3ad 动态链接聚合：创建共享相同的速度和双工设置的聚合组。

	=5：(balance-tlb) Adaptive transmit load balancing（适配器传输负载均衡）:没有特殊策略，第一个设备传不通就用另一个设备接管第一个设备正在处理的mac地址，帮助上一个传。

	=6：(balance-alb) Adaptive load balancing:（适配器传输负载均衡）：大致意思是包括mode5，bonding驱动程序截获 ARP 在本地系统发送出的请求，用其中之一的硬件地址覆盖从属设备的原地址。就像是在服务器上不同的人使用不同的硬件地址一样。


### 1. CentOS6+或redhat6+配置

### 1.1 配置bond模块

	[root@node1 ~]# cd /etc/sysconfig/network-scripts/
	[root@node1 network-scripts]# echo "alias netdev-bond0 bonding" >/etc/modprobe.d/bonding.conf

### 1.2 安装bridge支持

	[root@node1 ~]# yum install bridge-utils

### 1.3 开始配置网卡配置文件

### 1.3.1 em1配置

    DEVICE=em1
    NAME=em1
    TYPE=Ethernet
    ONBOOT=yes
    NM_CONTROLLED=yes
    BOOTPROTO=none
    MASTER=bond1
    SLAVE=yes

### 1.3.2 em2配置

    DEVICE=em2
    NAME=em2
    TYPE=Ethernet
    ONBOOT=yes
    NM_CONTROLLED=yes
    BOOTPROTO=none
    MASTER=bond1
    SLAVE=yes

### 1.3.3 em3配置

    DEVICE=em3
    NAME=em3
    TYPE=Ethernet
    ONBOOT=yes
    NM_CONTROLLED=yes
    BOOTPROTO=none
    MASTER=bond2
    SLAVE=yes

### 1.3.4 em4配置
        


    DEVICE=em4
    NAME=em4
    TYPE=Ethernet
    ONBOOT=yes
    NM_CONTROLLED=yes
    BOOTPROTO=none
    MASTER=bond2
    SLAVE=yes       

### 1.3.5 p6p1配置

    DEVICE=p6p1
    NAME=p6p1
    TYPE=Ethernet
    ONBOOT=yes
    NM_CONTROLLED=yes
    BOOTPROTO=none
    MASTER=bond3
    SLAVE=yes


### 1.3.6 p6p2配置

    DEVICE=p6p2
    NAME=p6p2
    TYPE=Ethernet
    ONBOOT=yes
    NM_CONTROLLED=yes
    BOOTPROTO=none
    MASTER=bond3
    SLAVE=yes 



### 1.3.7 bond1配置

    DEVICE=bond1
    TYPE=bond
    ONBOOT=yes
    BOOTPROTO=none
    BONDING_OPTS="miimon=80 mode=4"
    BRIDGE=br0

### 1.3.8 bond2配置

    DEVICE=bond1
    NAME=bond1
    TYPE=bond
    ONBOOT=yes
    BOOTPROTO=none
    BONDING_OPTS="miimon=80 mode=4"
    BRIDGE=br0

### 1.3.9 bond3配置

    DEVICE=bond2
    NAME=bond2
    TYPE=bond
    ONBOOT=yes
    BOOTPROTO=static
    USERCTL=no
    PEERDNS=yes
    IPADDR=10.199.10.202
    RPEFIX=24
    GATEWAY=10.199.10.1
    BONDING_OPTS="miimon=80 mode=6"


### 1.3.10 br0配置

	NAME=br0
	DEVICE=br0
	TYPE=Bridge
	ONBOOT=yes
	BOOTPROTO=none
	IPADDR=10.199.200.30
	PREFIX=24
	GATEWAY=10.199.200.2
	DNS1=10.199.200.15


**注意**：

1. 关闭NetworkManager，不然提示：


	eth0: Connection activation failed: Master connection not found or invalid
	br0:Conncetion activation failed: Failed to determine connection’s virtual interface name

2. 彻底移除bond模块的操作

	[root@node1 ~]# rmmod bonding
	

	
---
## 结束