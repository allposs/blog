---
title:          CentOS7.2安装KVM
date:           2016-05-04T14:20:23+08:00
draft:          true
tags:           [2016-05]
topics:         [kvm]
---

## 简介

&#160; &#160; &#160; &#160;Kernel-based Virtual Machine的简称，是一个开源的系统虚拟化模块，自Linux 2.6.20之后集成在Linux的各个主要发行版本中。它使用Linux自身的调度器进行管理，所以相对于Xen，其核心源码很少。KVM目前已成为学术界的主流VMM之一。

&#160; &#160; &#160; &#160;KVM的虚拟化需要硬件支持（如Intel VT技术或者AMD V技术)。是基于硬件的完全虚拟化。而Xen早期则是基于软件模拟的Para-Virtualization，新版本则是基于硬件支持的完全虚拟化。但Xen本身有自己的进程调度器，存储管理模块等，所以代码较为庞大。广为流传的商业系统虚拟化软件VMware ESX系列是基于软件模拟的Full-Virtualization。

<!--more-->
## 环境

+ 操作系统：CentOS7.1 X86_64
+ Yum源：163源
+ IP地址：
+ DNS：
+ 主机名：

## 软件包
### 1. Yum源
	
	[root@kvm ~]# yum groupinstall "X Window System"
	[root@kvm ~]# yum groupinstall gnome-desktop
	[root@kvm ~]#yum -y install libcanberra-gtk2 qemu-kvm.x86_64 qemu-kvm-tools.x86_64    libvirt.x86_64 libvirt-cim.x86_64 libvirt-client.x86_64 libvirt-java.noarch  libvirt-python.x86_64 libiscsi* dbus-devel  virt-clone tunctl virt-manager libvirt libvirt-python python-virtinst

### 2. 源码包
无
## 拓扑图
无

## 正文

---
### 一. 准备

### 1. 确定机器有VT 

终端输入命令：

	[root@kvm network-scripts]# grep vmx /proc/cpuinfo

如果flags: 里有vmx 或者svm就说明支持VT；如果没有任何的输出，说明你的cpu不支持，将无法使用KVM虚拟机。

### 2. 确保BIOS里开启VT,使用如下命令

	[root@kvm network-scripts]# lsmod | grep kvm 


### 二. 桥接网络

使用桥接网络，虚拟机即可与其他机器互相访问。

### 1. 复制ifcfg-eno16777736为ifcfg-br0，并更改ifcfg-eno16777736配置。

	[root@kvm ~]# cd /etc/sysconfig/network-scripts/
	[root@kvm network-scripts]# cp ifcfg-eno16777736 ifcfg-br0 
	[root@kvm network-scripts]# vim ifcfg-br0

修改如下：

	TYPE=Bridge
	BOOTPROTO=none
	DEFROUTE=yes
	NAME=br0
	DEVICE=br0
	ONBOOT=yes
	IPADDR0=10.199.200.22
	PREFIX0=24
	GATEWAYO=10.199.200.2

### 2. 修改ifcfg-eno16777736


	[root@kvm network-scripts]# vi ifcfg-eno16777736 


修改为：

	TYPE=Ethernet
	DEFROUTE=yes
	NAME=eno16777736
	DEVICE=eno16777736
	ONBOOT=yes
	BRIDGE=br0

### 3. 重启网路

	[root@kvm network-scripts]# systemctl restart NetworkManager
	[root@kvm network-scripts]# systemctl restart network

### 三 安装
### 1. 安装KVM

	[root@kvm ~]# yum -y install libcanberra-gtk2 qemu-kvm.x86_64 qemu-kvm-tools.x86_64    libvirt.x86_64 libvirt-cim.x86_64 libvirt-client.x86_64 libvirt-java.noarch  libvirt-python.x86_64 libiscsi* dbus-devel  virt-clone virt-manager libvirt libvirt-python python-virtinst

### 2. 安装桌面

	[root@kvm ~]# yum groupinstall "X Window System"
	[root@kvm ~]# yum install gnome-classic-session gnome-terminal dejavu-sans-mono-fonts nautilus-open-terminal

如果需要中文字体的话，需要安装下面软件包

	[root@kvm ~]# yum install cjkuni-uming-fonts

设置开机启动

	[root@kvm ~]# systemctl set-default graphical.target

---
## 结束