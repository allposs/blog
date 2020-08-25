---
title:          004-SeLinux配置基础
date:           2016-06-25T14:20:23+08:00
draft:          true
tags:           [2016-06]
topics:         [Linux,SeLinux]
---

## 简介

&#160; &#160; &#160; &#160;SELinux(Security-Enhanced Linux) 是美国国家安全局（NAS）对于强制访问控 制的实现，在这种访问控制体系的限制下，进程只能访问那些在他的任务中所需要文件。大部分使用 SELinux 的人使用的都是SELinux就绪的发行版，例如 Fedora、Red Hat Enterprise Linux (RHEL)、Debian 或 Gentoo。它们都是在内核中启用SELinux 的，并且提供一个可定制的安全策略，还提供很多用户层的库和工具，它们都可以使用 SELinux 的功能。
<!--more-->
## 版本

SeLinux

## 正文
---
### 1. SElinux特点

1). MAC

&#160; &#160; &#160; &#160;对访问的控制彻底化，对所有的文件、目录、端口的访问都是基于策略设定的，可由管理员时行设定。

2). RBAC

&#160; &#160; &#160; &#160;对于用户只赋予最小权限。用户被划分成了一些role(角色)，即使是root用户，如果不具有sysadm_r角色的话，也不是执行相关的管理。哪里role可以执行哪些domain,也是可以修改的。

3). 安全上下文

&#160; &#160; &#160; &#160;当启动selinux的时候，所有文件与对象都有安全上下文。进程的安全上下文是域，安全上下文由用户:角色:类型表示。

* (1)系统根据pam子系统中的pam_selinux.so模块设定登录者运行程序的安全上下文
* (2)rpm包安装会根据rpm包内记录来生成安全上下文，
* (3)如果是手工他建的，会根据policy中规定来设置安全上下文，
* (4)如果是cp，会重新生成安全上下文。
* (5)如果是mv,安全上下文不变。

### 2. 安全上下文格式

安全上下文由user:role:type三部分组成，下面分别说明其作用：

1. user identity:

&#160; &#160; &#160; &#160;类似linux系统中的UID，提供身份识别，安全上下文中的一部分。三种常见的user:

	user_u-:   普通用户登录系统后预设；
	system_u-：开机过程中系统进程的预设；
	root-：    root登录后预设；

&#160; &#160; &#160; &#160;在targeted policy中users不是很重要；在strict policy中比较重要，的有预设的selinuxusers都以 "_u"结尾，root除外。

2. role

&#160; &#160; &#160; &#160;文件与目录的role，通常是object_r；程序的role，通常是system_r；用户的role，targetedpolicy为system_r；strict policy为sysadm_r，staff_r，user_r用户的role，类似于系统中的GID，不同的角色具备不同的权限；用户可以具备多个role；但是同一时间内只能使用一role；role是RBAC的基础；

3. type

&#160; &#160; &#160; &#160;type:用来将主体与客体划分为不同的组，组每个主体和系统中的客体定义了一个类型；为进程运行提供最低的权限环境。当一个类型与执行的进程关联时，该type也称为domain，也叫安全上下文。域或安全上下文是一个进程允许操作的列表，决字一个进程可以对哪种类型进行操作。

### 3. SeLinux配置文件

	vi/etc/selinux/config
	# This filecontrols the state of SELinux on the system.
	# SELINUX= cantake one of these three values:
	# enforcing -SELinux security policy is enforced.
	# permissive -SELinux prints warnings instead of enforcing.
	# disabled -SELinux is fully disabled.
	SELINUX=enforcing
	#SELINUX=disabled
	# SELINUXTYPE=type of policy in use. Possible values are:
	# targeted -Only targeted network daemons are protected.
	# strict -Full SELinux protection.
	SELINUXTYPE=targeted
	#SELINUX有「disabled」「permissive」，「enforcing」3种选择。

1). 模式的设置

	enforcing:强制模式，只要selinux不允许，就无法执行
	permissive:警告模式，将该事件记录下来，依然允许执行
	disabled:关闭selinux；停用，启用需要重启计算机。
 
2). 策略的设置

&#160; &#160; &#160; &#160;targeted:保护常见的网络服务，是selinux的默认值；stric:提供RBAC的policy，具备完整的保护功能，保护网络服务，一般指令及应用程序。策略改变后，需要重新启动计算机。也可以通过命令来修改相关的具体的策略值，也就是修改安全上下文，来提高策略的灵活性。
 
3). 策略的位置

/etc/selinux/<策略名>/policy/
 
### 4. SElinux命令介绍
### 4.1 查询SElinux状态命令

1). 查询selinux状态

	[root@redhat~]# sestatus
	SELinux status:                 enabled
	SELinuxfsmount:                /selinux
	Currentmode:                   enforcing
	Mode fromconfig file:          enforcing
	Policyversion:                 21
	Policy fromconfig file:        targeted

2). 查询selinux激活状态

	[root@redhat~]# selinuxenabled
	[root@redhat~]# echo $?
	0

如果为-256为非激活状态。

### 4.2 切换SElinux类型

1). 切换成警告模式

	[root@redhat~]# setenforce 0或setenforce permissive
	[root@redhat~]# sestatus
	SELinuxstatus:                 enabled
	SELinuxfsmount:                /selinux
	Currentmode:                   permissive
	Mode fromconfig file:          enforcing
	Policyversion:                 21
	Policy fromconfig file:        targeted
	或
	[root@redhat~]# getenforce
	Permissive

2). 切换成强制模式

	[root@redhat~]# setenforce 1
	[root@redhat~]# getenforce
	Enforcing

注：使用setenforce切换enforcing与permissive模式不需要重启计算机。

### 4.3 检查安全上下文

1). 检查帐号的安全上下文

	[root@redhat~]# id -Z
	root:system_r:unconfined_t:SystemLow-SystemHigh

2). 检查进程的安全上下文

	[root@redhathome]# ps -Z
	LABEL                             PIDTTY          TIME CMD
	root:system_r:unconfined_t:SystemLow-SystemHigh2383 pts/0 00:00:00 bash
	root:system_r:unconfined_t:SystemLow-SystemHigh2536 pts/0 00:00:00 ps

3). 检查文件与目录的安全上下文

	[root@redhathome]# ls -Z
	drwx------  tom  tom  system_u:object_r:user_home_dir_ttom

### 4.4 修改文件/目录安全上下文与策略

1). chcon命令

	chcon -u[user]  对象
	      -r[role]
	      -t[type]
	      -R递归
	示例：
	chcon -R -tsamba_share_t /tmp/abc
	注：安全上下文的简单理解说明，受到selinux保护的进程只能访问标识为自己只够访问的安全上下文的文件与目录。
	例如：上面解释为使用smb进程能够访问/tmp/abc目录而设定的安全上下文。
 
2). getsebool命令

获取本机selinux策略值，也称为bool值。getsebool-a  命令同sestatus -b

	[root@redhatfiles]# getsebool -a
	NetworkManager_disable_trans--> off
	allow_cvs_read_shadow--> off
	allow_daemons_dump_core--> on
	allow_daemons_use_tty--> off
	allow_execheap--> off
	allow_execmem--> on
	allow_execmod--> off
	allow_execstack--> on
	allow_ftpd_anon_write--> off  
	allow_ftpd_full_access--> off
	...
	httpd_disable_trans--> off   

说明：selinux的设置一般通过两个部分完成的，一个是安全上下文，另一个是策略，策略值是对安全上下文的补充。
 
3). setsebool命令

setsebool -P allow_ftpd_anon_write=1;-P 是永久性设置，否则重启之后又恢复预设值。

示例：

	[root@redhatfiles]# setsebool -P allow_ftpd_anon_write=1
	[root@redhatfiles]# getsebool allow_ftpd_anon_write
	allow_ftpd_anon_write--> on

说明：如果仅仅是安全上下文中设置了vsftpd进程对某一个目录的访问，配置文件中也允许可写，但是selinux中策略中不允许可写，仍然不可写。所以基于selinux保护的服务中，安全性要高于很多。
 
### 5. SElinux应用

&#160; &#160; &#160; &#160;selinux的设置分为两个部分，修改安全上下文以及策略，下面收集了一些应用的安全上下文，供配置时使用，对于策略的设置，应根据服务应用的特点来修改相应的策略值。

### 5.1 SElinux与samba

1). samba共享的文件必须用正确的selinux安全上下文标记。

	chcon -R -t samba_share_t /tmp/abc

如果共享/home/abc，需要设置整个主目录的安全上下文。

	chcon -R -r samba_share_t /home

2). 修改策略(只对主目录的策略的修改)

	setsebool -P samba_enable_home_dirs=1
	setsebool -P allow_smbd_anon_write=1

getsebool 查看

	samba_enable_home_dirs -->on
	allow_smbd_anon_write --> on

### 5.2 SElinux与nfs

&#160; &#160; &#160; &#160;selinux对nfs的限制好像不是很严格，默认状态下，不对nfs的安全上下文进行标记，而且在默认状态的策略下，nfs的目标策略允许nfs_export_all_ro

	nfs_export_all_ro
	nfs_export_all_rw值为0

所以说默认是允许访问的。但是如果共享的是/home/abc的话，需要打开相关策略对home的访问。

	setsebool -Puse_nfs_home_dirs boolean 1
	getsebooluse_nfs_home_dirs

### 5.3 SElinux与ftp

1). 如果ftp为匿名用户共享目录的话，应修改安全上下文。

	chcon -R -t public_content_t /var/ftp
	chcon -R -t public_content_rw_t /var/ftp/incoming
 
2). 策略的设置

	setsebool -P allow_ftpd_anon_write =1
	getsebool allow_ftpd_anon_write
	allow_ftpd_anon_write--> on
 
### 5.4 SElinux与http

apache的主目录如果修改为其它位置，selinux就会限制客户的访问。

1). 修改安全上下文：

	chcon -R -t httpd_sys_content_t /home/html

由于网页都需要进行匿名访问，所以要允许匿名访问。

2). 修改策略：

	setsebool -P allow_ftpd_anon_write = 1
	setsebool -P allow_httpd_anon_write = 1
	setsebool -P allow_<协议名>_anon_write =1

关闭selinux对httpd的保护

	httpd_disable_trans=0

### 5.5 SElinux与公共目录共享

如果ftp,samba,web都访问共享目录的话，该文件的安全上下文应为：

	public_content_t
	public_content_rw_t

其它各服务的策略的bool值，应根据具体情况做相应的修改。
 
### 5.6 SElinux配置总结

以上内容的selinux的配置实验还需要进行相关验证，以便在实际环境中能够直接应用，相关的内容还需要继续补充。

对于多于牛毛的策略，可以用过滤还查看一个服务相当开启哪些策略。
 
------------------------------------------------------------------------------

SELinux主要配制文件

&#160; &#160; &#160; &#160;SELinux主要配制文件位于/etc/selinux/下。在网络中的服务器，建议开启SELinx，以提高系统的安全性。我这里通过命令方式来改变SELinx的安全策略，就不在对SELinux的配制文件做具体说明。

SELinux常用的命令:

 	ls –Z |ps –Z | id –Z	分别用于查看文件（夹）、进程和用户的SELinx属性。最常用的是ls -Z
  	sestatus				查看当前SELinux的运行状态
  	setenforce				在SELinux为启动模式下，用此命令可以暂时停用SELinux
  	getsebool				查看当前Policy（策略）的布尔值
  	setsebool				设置Policy的布尔值，以启用或停用某项Policy
   	chcon					改变文件或文件夹的content标记

SELinux实用案例:

SELinux对Apache的保护

&#160; &#160; &#160; &#160;新安装的wordpress位于/vogins/share/wordpress下，按照系统的默认策略，/vogins,/vogins/share的SELinux属性为file_t，而这是不允许httpd进程直接访问的。为此，需要做如下高调整：

1) 改变/vogins,/vogins/share的SELinux属性

	Shell>chcon –t var_t /vogins
	Shell>chcon –t var_t /vogins/share

2) 改变wrodpress目录的SELinux属性

	Shell>chcon –R –t httpd_sys_content_t wordpress

3) 允许apache进程访问mysql

	setsebool -Phttpd_can_network_connect=1

4) 关于Apache里虚拟主机的配制就里就不多说，重新启动apache，就可以正常访问wordpress

	Shell>/etc/init.d/httpd start

注意：如果出现不能访问的情况，请查看/var/log/messages里的日志。一般来说，按照提示就可以解决了。
 
LINUX 中SELINUX 的禁用方式

经网上查看资料，发现是SELinux在作怪，现在记录下来，以后继续完善

1、临时禁用SELinux：

	root@server# setenforce 0
  
这样重启服务器之后，还是会启动SELinux.

2、永久禁用：
打开服务器上的SELinux配置文件，默认为：/etc/selinux/config，内容如下：

	# This file controls the state of SELinux on the system.
	# SELINUX= can take one of these three values:
	#       enforcing - SELinux security policy is enforced.
	#       permissive - SELinux prints warnings instead of enforcing.
	#       disabled - SELinux is fully disabled.
	SELINUX=enforcing
	# SELINUXTYPE= type of policy in use. Possible values are:
	#       targeted - Only targeted network daemons are protected.
	#       strict - Full SELinux protection.
	SELINUXTYPE=targeted

将上面的

	SELINUX=enforcing 改为：SELINUX=disable  禁用SeLinux


先安装setroubleshoot 组件。有的资料说他是默认安装的，但在我的CentOS5.5上没有。

	yum install setroubleshoot

&#160; &#160; &#160; &#160;由 CentOS 5 起，你可以用 SELinux 排除疑难工具协助你分析日志档，将它们转换为供人阅读的格式。这个工具包含一个以可读格式显示信息及解决方案的图像界面、一个桌面通报图示、与及一个长驻进程（setroubleshootd），它负责查阅新的 SELinux AVC 警告并传送至通报图示（不运行 X 服务器的话可设置以电邮通报）。SELinux 排除疑难工具是由 setroubleshoot 组件所提供，并缺省会被安装。这个工具可以从「系统」选单或命令行引导：
	sealert -b

不运行 X 服务器的人可以通过命令行产生供人阅读的报告：

	sealert -a /var/log/audit/audit.log > /path/to/mylogfile.txt
---
## 结束