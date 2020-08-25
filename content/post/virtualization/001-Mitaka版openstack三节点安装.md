---
title:          Mitaka版openstack三节点安装
date:           2016-06-17T14:20:23+08:00
draft:          true
tags:           [2016-06]
topics:         [Openstack]
---

## 简介

&#160; &#160; &#160; &#160;Mitaka版openstack三节点安装文档。

<!--more-->

## 环境

+ 操作系统：CentOS7.1 X86_64
+ Yum源：163源 
+ IP地址：略
+ DNS：略
+ 主机名：opsnode1.example.com,opsnode2.example.com,opsnode3.example.com

## 软件包

### 1. Yum源

见部署


## 拓扑图

## 正文
---
### 1. 准备工作
注意:

&#160; &#160; &#160; &#160;各节点机器至少3个网卡

&#160; &#160; &#160; &#160;标注“//”的为暂时没有测试，标注“[root@opsnode* ~]# ”为命令提示符，标注为“#”的为注示，标注“MariaDB [(none)]>”为数据库命令行

&#160; &#160; &#160; &#160;标注“[root@opsnode1 ~]# ”为opsnode1主机，标注“[root@opsnode2 ~]# ”为opsnode2主机,以些类推，标注“[root@opsnode* ~]# ”为所有主机

### 1.1 初始环境

### 1.1.1 系统初始安装

&#160; &#160; &#160; &#160;因为我的linux是使用CentOS7.2版本最小化安装，所以需要安装相关软件和配置网络

    [root@opsnode* ~]# yum install bash-* vim wget net-tools
    [root@opsnode* ~]# vim /etc/hosts
    	#node1
    	172.16.10.11    opsnode1.example.com    
    	#node2
    	172.16.10.12    opsnode2.example.com    
    	#node3
    	172.16.10.13    opsnode3.example.com    
    	#node4
    	172.16.10.14    opsnode4.example.com
    [root@opsnode* ~]# systemctl stop firewall

&#160; &#160; &#160; &#160;计算节点需要配置kvm

	[root@opsnode2 ~]#	yum -y install libcanberra-gtk2 qemu-kvm.x86_64 qemu-kvm-tools.x86_64 \
					libvirt.x86_64 libvirt-cim.x86_64 libvirt-client.x86_64 libvirt-java.noarch \
					libvirt-python.x86_64 libiscsi* dbus-devel  virt-clone virt-manager libvirt \
					libvirt-python python-virtinst

### 1.1.2 安装yum源

	centos
	[root@opsnode* ~]# yum install centos-release-openstack-mitaka
	redhat
	[root@opsnode* ~]# yum install https://rdoproject.org/repos/rdo-release.rpm

	[root@opsnode* ~]# yum upgrade
	[root@opsnode* ~]# yum install python-openstackclient
	[root@opsnode* ~]# yum install openstack-selinux

### 1.1.3 配置相关辅助服务：dns， ntp

&#160; &#160; &#160; &#160;可以根据我以前写的文章配置，这里就不重复了，dns可以用修改hosts文件替代


### 2. 开始安装

### 2.1 安装数据库

	[root@opsnode1 ~]# yum install mariadb mariadb-server python2-PyMySQL
	[root@opsnode1 ~]# vim /etc/my.cnf.d/openstack.cnf
		[mysqld]
		bind-address =  192.168.10.101
		default-storage-engine = innodb
		collation-server = utf8_general_ci
		datadir = /data/mariadb/db/openstack
		interactive_timeout = 300
		wait_timeout = 300

		#character set
		character-set-server = utf8

		open_files_limit = 65535
		max_connections = 100
		max_connect_errors = 100000
		#
		explicit_defaults_for_timestamp
		#logs
		log-output=file
		slow_query_log = 0.5
		slow_query_log_file = slow.log
		#log-error = error.log
		#log_error_verbosity=3
		#pid-file = 
		long_query_time = 1
		#log-slow-admin-statements = 1
		#log-queries-not-using-indexes = 1
		log-slow-slave-statements = 1

		#binlog
		binlog_format = row
		server-id = 63306
		log-bin = /data/mariadb/db/openstack
		binlog_cache_size = 1M
		max_binlog_size = 200M
		max_binlog_cache_size = 1G
		sync_binlog = 0
		expire_logs_days = 10

		#relay log
		skip_slave_start = 1
		max_relay_log_size = 500M
		relay_log_purge = 1
		relay_log_recovery = 1
		log_slave_updates

		#buffers & cache
		table_open_cache = 2048
		table_definition_cache = 2048
		table_open_cache = 2048
		max_heap_table_size = 6M
		sort_buffer_size = 2M
		join_buffer_size = 2M
		thread_cache_size = 256
		query_cache_size = 0
		query_cache_type = 0
		thread_stack = 192K
		tmp_table_size = 8M
		read_buffer_size = 2M
		read_rnd_buffer_size = 16M
		bulk_insert_buffer_size = 32M

		#myisam
		key_buffer_size=8M

		#innodb
		innodb_buffer_pool_size = 2G
		innodb_buffer_pool_instances = 1
		innodb_data_file_path = ibdata1:1024M:autoextend
		innodb_flush_log_at_trx_commit = 1
		innodb_log_buffer_size = 64M
		innodb_log_file_size = 256M
		innodb_log_files_in_group = 3
		innodb_max_dirty_pages_pct = 90
		innodb_file_per_table = 1
		innodb_rollback_on_timeout
		innodb_status_file = 1
		innodb_io_capacity = 2000
		innodb_read_io_threads=8
		innodb_write_io_threads=8
	[root@7Node1 ~]# mkdir -p /data/mariadb/db/openstack
	[root@7Node1 ~]# chown -R mysql.mysql /data/mariadb
	[root@7Node* ~]# systemctl enable mariadb.service
	[root@7Node* ~]# systemctl start mariadb.service
	#初始化mariadb，密码为redhat
	[root@7Node* ~]# mysql_secure_installation
	[root@opsnode1 ~]# mysql -u root -p
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'redhat' WITH GRANT OPTION;
		
### 2.2 安装rabbitmq

	[root@opsnode1 ~]# yum install rabbitmq-server
	[root@opsnode1 ~]# systemctl enable rabbitmq-server.service
	[root@opsnode1 ~]# systemctl start rabbitmq-server.service
	#（开启web管理，这里所有操作都要先启动rabbitmq，web默认帐号和密码都为guest）
	[root@opsnode1 ~]# rabbitmq-plugins enable rabbitmq_management 
	[root@opsnode1 ~]# rabbitmqctl add_user openstack openstack
	[root@opsnode1 ~]# rabbitmqctl set_permissions openstack ".*" ".*" ".*"
	[root@opsnode1 ~]# systemctl restart rabbitmq-server.service
	
### 2.3 安装Memcached

	[root@opsnode1 ~]# yum install memcached python-memcached
	[root@opsnode1 ~]# systemctl enable memcached.service
	[root@opsnode1 ~]# systemctl start memcached.service
	
### 2.4 安装mongodb

	[root@7Node1 ~]# yum install mongodb-server mongodb
	[root@7Node1 ~]# vim /etc/mongod.conf
		bind_ip = 192.168.10.101
		dbpath = /data/mongodb/db/
	[root@7Node1 ~]# mkdir  /data/mongodb/db/ -p
	[root@7Node1 ~]# chown -R  mongodb.mongodb /data/mongodb	
	[root@7Node1 ~]# systemctl enable mongod.service
	[root@7Node1 ~]# systemctl start mongod.service
	
### 2.5 配置keystone
### 2.5.1 配置keystone数据库

	[root@opsnode1 ~]# mysql -u root -p
		MariaDB [(none)]> CREATE DATABASE keystone;
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'keystone' IDENTIFIED BY 'keystone';
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'%' IDENTIFIED BY 'keystone';

### 2.5.2 配置安装keystone

	#hex一个随机值
	[root@opsnode1 ~]# openssl rand -hex 10
		f2c421acc8ac94a01097	
	[root@opsnode1 ~]# yum install openstack-keystone httpd mod_wsgi
	[root@opsnode1 ~]# vim /etc/keystone/keystone.conf 
		[DEFAULT]
		#开启详细日志功能
		verbose = True
		#定义管理员token初始值
		admin_token = f2c421acc8ac94a01097
		
		[database]
		#数据库连接
		connection = mysql+pymysql://keystone:keystone@opsnode1.example.com/keystone

		//[memcache]
		//#配置Memcached服务
		//servers = 172.16.10.11:11211
		
		[token]
		provider = fernet
		//配置 UUID token provider 和Memcached 驱动
		//provider = uuid
		//driver = memcache
	#导入数据库
	[root@opsnode1 ~]# su -s /bin/sh -c "keystone-manage db_sync" keystone
	#初始化Fernet密钥
	[root@opsnode1 ~]# keystone-manage fernet_setup --keystone-user keystone --keystone-group keystone
	[root@opsnode1 ~]# vim /etc/httpd/conf/httpd.conf
		ServerName opsnode1.example.com
	[root@opsnode1 ~]# vim  /etc/httpd/conf.d/wsgi-keystone.conf 
		Listen 5000
		Listen 35357

		<VirtualHost *:5000>
			WSGIDaemonProcess keystone-public processes=5 threads=1 user=keystone group=keystone display-name=%{GROUP}
			WSGIProcessGroup keystone-public
			WSGIScriptAlias / /usr/bin/keystone-wsgi-public
			WSGIApplicationGroup %{GLOBAL}
			WSGIPassAuthorization On
			ErrorLogFormat "%{cu}t %M"
			ErrorLog /var/log/httpd/keystone-error.log
			CustomLog /var/log/httpd/keystone-access.log combined

			<Directory /usr/bin>
				Require all granted
			</Directory>
		</VirtualHost>

		<VirtualHost *:35357>
			WSGIDaemonProcess keystone-admin processes=5 threads=1 user=keystone group=keystone display-name=%{GROUP}
			WSGIProcessGroup keystone-admin
			WSGIScriptAlias / /usr/bin/keystone-wsgi-admin
			WSGIApplicationGroup %{GLOBAL}
			WSGIPassAuthorization On
			ErrorLogFormat "%{cu}t %M"
			ErrorLog /var/log/httpd/keystone-error.log
			CustomLog /var/log/httpd/keystone-access.log combined

			<Directory /usr/bin>
				Require all granted
			</Directory>
		</VirtualHost>
	[root@opsnode1 ~]# systemctl enable httpd.service
	[root@opsnode1 ~]# systemctl start httpd.service

### 3.5.3 创建服务实体和API端点

	#设置临时环境变量 
	[root@opsnode1 ~]# export OS_TOKEN=f2c421acc8ac94a01097
	[root@opsnode1 ~]# export OS_URL=http://opsnode1.example.com:35357/v3	
	[root@opsnode1 ~]# export OS_IDENTITY_API_VERSION=3
	#在你的Openstack环境中，认证服务管理服务目录。服务使用这个目录来决定您的环境中可用的服务
	#创建服务实体的身份服务：
	[root@opsnode1 ~]# openstack service create --name keystone --description "OpenStack Identity" identity
		+-------------+----------------------------------+
		| Field       | Value                            |
		+-------------+----------------------------------+
		| description | OpenStack Identity               |
		| enabled     | True                             |
		| id          | 0b94ae323bc54478a5e21a9395357c70 |
		| name        | keystone                         |
		| type        | identity                         |
		+-------------+----------------------------------+
	#身份服务管理目录的API端点 OpenStack的服务环境。 服务使用这个目录决定如何在您的环境中与其他服务进行通信。
	#OpenStack使用三个API端点变种代表每种服务：admin，internal和public。默认情况下，管理API端点允许修改用户和租户而公共和内部APIs不允许这些操作。在生产环境中，处于安全原因，变种为了服务不同类型的用户可能驻留在单独的网络上。对实例而言，公共API网络为了让顾客管理他们自己的云在互联网上是可见的。管理API网络在管理云基础设施的组织中操作也是有所限制的。内部API网络可能会被限制在包含OpenStack服务的主机上。此外，OpenStack支持可伸缩性的多区域。为了简单起见，本指南为所有端点变种和默认``RegionOne``区域都使用管理网络。
	#每个添加到OpenStack环境中的服务要求一个或多个服务实体和三个认证服务中的API 端点变种。
	#创建认证服务的 API 端点：
	[root@opsnode1 ~]# openstack endpoint create --region RegionOne identity public http://opsnode1.example.com:5000/v3
		+--------------+-------------------------------------+
		| Field        | Value                               |
		+--------------+-------------------------------------+
		| enabled      | True                                |
		| id           | 574c20d08e274cb1b4bb9cc96b0f3254    |
		| interface    | public                              |
		| region       | RegionOne                           |
		| region_id    | RegionOne                           |
		| service_id   | 0b94ae323bc54478a5e21a9395357c70    |
		| service_name | keystone                            |
		| service_type | identity                            |
		| url          | http://opsnode1.example.com:5000/v3 |
		+--------------+-------------------------------------+	
	
	[root@opsnode1 ~]# openstack endpoint create --region RegionOne identity internal http://opsnode1.example.com:5000/v3
		+--------------+-------------------------------------+
		| Field        | Value                               |
		+--------------+-------------------------------------+
		| enabled      | True                                |
		| id           | 224c1f5b94014ba2afa585d73a9f0cd8    |
		| interface    | internal                            |
		| region       | RegionOne                           |
		| region_id    | RegionOne                           |
		| service_id   | 0b94ae323bc54478a5e21a9395357c70    |
		| service_name | keystone                            |
		| service_type | identity                            |
		| url          | http://opsnode1.example.com:5000/v3 |
		+--------------+-------------------------------------+
		
	[root@opsnode1 ~]# openstack endpoint create --region RegionOne identity admin http://opsnode1.example.com:35357/v3
		+--------------+--------------------------------------+
		| Field        | Value                                |
		+--------------+--------------------------------------+
		| enabled      | True                                 |
		| id           | a0c6960c833447378b7bb46222c8a8d9     |
		| interface    | admin                                |
		| region       | RegionOne                            |
		| region_id    | RegionOne                            |
		| service_id   | 0b94ae323bc54478a5e21a9395357c70     |
		| service_name | keystone                             |
		| service_type | identity                             |
		| url          | http://opsnode1.example.com:35357/v3 |
		+--------------+--------------------------------------+
	
	
### 3.5.4 创建项目、用户和角色

	#创建 admin 项目：
	[root@opsnode1 ~]# openstack domain create --description "Default Domain" default
		+-------------+----------------------------------+
		| Field       | Value                            |
		+-------------+----------------------------------+
		| description | Default Domain                   |
		| enabled     | True                             |
		| id          | e824551f502b4083aee78ca2392400ad |
		| name        | default                          |
		+-------------+----------------------------------+
	#创建 admin 组：
	[root@opsnode1 ~]#  openstack project create --domain default  --description "Admin Project" admin
		+-------------+----------------------------------+
		| Field       | Value                            |
		+-------------+----------------------------------+
		| description | Admin Project                    |
		| domain_id   | e824551f502b4083aee78ca2392400ad |
		| enabled     | True                             |
		| id          | 964f00c0843c45be982b8898a722bd63 |
		| is_domain   | False                            |
		| name        | admin                            |
		| parent_id   | e824551f502b4083aee78ca2392400ad |
		+-------------+----------------------------------+
	#创建 admin 用户：	
	[root@opsnode1 ~]# openstack user create --domain default --password-prompt admin
		User Password:admin
		Repeat User Password:admin
		+-----------+----------------------------------+
		| Field     | Value                            |
		+-----------+----------------------------------+
		| domain_id | e824551f502b4083aee78ca2392400ad |
		| enabled   | True                             |
		| id        | 513f2b8c7e674cce8dca4002166b81a0 |
		| name      | admin                            |
		+-----------+----------------------------------+
	#创建 admin 角色：
	[root@opsnode1 ~]# openstack role create admin
		+-----------+----------------------------------+
		| Field     | Value                            |
		+-----------+----------------------------------+
		| domain_id | None                             |
		| id        | c3332913b40b4410976be37bfb2b1120 |
		| name      | admin                            |
		+-----------+----------------------------------+
	#添加``admin`` 角色到 admin 项目和用户上：
	[root@opsnode1 ~]# openstack role add --project admin --user admin admin
	创建service项目：
	[root@opsnode1 ~]# openstack project create --domain default --description "Service Project" service
		+-------------+----------------------------------+
		| Field       | Value                            |
		+-------------+----------------------------------+
		| description | Service Project                  |
		| domain_id   | e824551f502b4083aee78ca2392400ad |
		| enabled     | True                             |
		| id          | 62d5e7d6fe3f45fcbdf92177c6f9c289 |
		| is_domain   | False                            |
		| name        | service                          |
		| parent_id   | e824551f502b4083aee78ca2392400ad |
		+-------------+----------------------------------+
	#创建demo项目：
	[root@opsnode1 ~]# openstack project create --domain default  --description "Demo Project" demo
		+-------------+----------------------------------+
		| Field       | Value                            |
		+-------------+----------------------------------+
		| description | Demo Project                     |
		| domain_id   | e824551f502b4083aee78ca2392400ad |
		| enabled     | True                             |
		| id          | 70622483fbe243b5bb96facbe41b7139 |
		| is_domain   | False                            |
		| name        | demo                             |
		| parent_id   | e824551f502b4083aee78ca2392400ad |
		+-------------+----------------------------------+
	#创建demo用户：
	[root@opsnode1 ~]# openstack user create --domain default  --password-prompt demo
		User Password:apidemo
		Repeat User Password:apidemo
		+-----------+----------------------------------+
		| Field     | Value                            |
		+-----------+----------------------------------+
		| domain_id | e824551f502b4083aee78ca2392400ad |
		| enabled   | True                             |
		| id        | e9cf15056cda424db7356da095b547ec |
		| name      | demo                             |
		+-----------+----------------------------------+
	#创建 user 角色：
	[root@opsnode1 ~]# openstack role create user
		+-----------+----------------------------------+
		| Field     | Value                            |
		+-----------+----------------------------------+
		| domain_id | None                             |
		| id        | ea25765d55e24ef2a4f369b55fa4955b |
		| name      | user                             |
		+-----------+----------------------------------+
	#添加user角色到demo项目和用户：
	[root@opsnode1 ~]# openstack role add --project demo --user demo user
	
### 3.5.5 验证操作

	# 删除临时环境变量 
	[root@opsnode1 ~]# unset OS_TOKEN OS_URL
	#使用 admin 用户，请求认证令牌：
	[root@opsnode1 ~]# openstack --os-auth-url http://opsnode1.example.com:35357/v3 --os-project-domain-name default --os-user-domain-name default --os-project-name admin --os-username admin token issue
		Password: admin
		+------------+-----------------------------------------------------------------------------------------------------------+
		| Field      | Value                                                                                                     |
		+------------+-----------------------------------------------------------------------------------------------------------+
		| expires    | 2016-06-15T04:28:39.224333Z                                                                               |
		| id         | gAAAAABXYMtnYpkjpLFS99oOEp_3n1yqQNzMCba6eP2n9l5zIyzC5JXLUCOkIeVVajIXIGfGBF3g7ZUJkJxaO_7jb4WBQaAGabGI549XY |
		|            | Kc858BEWOU_OYwl_hOhxRkKJB-XovhwnBNmy0YAnw8B7JEXFrOTdJ29cGh6YREj8i9SIY6VOdSEBaE                            |
		| project_id | 964f00c0843c45be982b8898a722bd63                                                                          |
		| user_id    | 513f2b8c7e674cce8dca4002166b81a0                                                                          |
		+------------+-----------------------------------------------------------------------------------------------------------+
	#使用demo用户，请求认证令牌：	
	[root@opsnode1 ~]# openstack --os-auth-url http://opsnode1.example.com:5000/v3 --os-project-domain-name default --os-user-domain-name default  --os-project-name demo --os-username demo token issue
		Password: apidemo
		+------------+-----------------------------------------------------------------------------------------------------------+
		| Field      | Value                                                                                                     |
		+------------+-----------------------------------------------------------------------------------------------------------+
		| expires    | 2016-06-15T04:30:15.048744Z                                                                               |
		| id         | gAAAAABXYMvHBJHMimr4rDH73Eg40Gvw378hlSBiUtq3oCtI7o8h7                                                     |
		|            | -PzbzMsgcLePlzHxOR0ZzAGxDw3kThpHTqvgxkYBSijuG10MZe28YWg1aFFXVZy01o784IxXGyMdA05Y41F48jd-                  |
		|            | R8OAHbR6clDxCJJYavrYXMu5Ond4H8p-yhVcLdrWbM                                                                |
		| project_id | 70622483fbe243b5bb96facbe41b7139                                                                          |
		| user_id    | e9cf15056cda424db7356da095b547ec                                                                          |
		+------------+-----------------------------------------------------------------------------------------------------------+
	
### 3.5.6 创建环境脚本
	
	[root@opsnode1 ~]# vim admin-openrc
		export OS_PROJECT_DOMAIN_NAME=default
		export OS_USER_DOMAIN_NAME=default
		export OS_PROJECT_NAME=admin
		export OS_USERNAME=admin
		export OS_PASSWORD=admin
		export OS_AUTH_URL=http://opsnode1.example.com:35357/v3
		export OS_IDENTITY_API_VERSION=3
		export OS_IMAGE_API_VERSION=2
	
	[root@opsnode1 ~]# vim demo-openrc
		export OS_PROJECT_DOMAIN_NAME=default
		export OS_USER_DOMAIN_NAME=default
		export OS_PROJECT_NAME=demo
		export OS_USERNAME=demo
		export OS_PASSWORD=apidemo
		export OS_AUTH_URL=http://opsnode1.example.com:5000/v3
		export OS_IDENTITY_API_VERSION=3
		export OS_IMAGE_API_VERSION=2
	
	[root@opsnode1 ~]# . admin-openrc
	[root@opsnode1 ~]# openstack token issue
		+------------+-----------------------------------------------------------------------------------------------------------+
		| Field      | Value                                                                                                     |
		+------------+-----------------------------------------------------------------------------------------------------------+
		| expires    | 2016-06-15T04:35:06.149368Z                                                                               |
		| id         | gAAAAABXYMzqTVO5HBg6Uk1ZJeXDmBPAx2gO4P2X1u1Z8RP2zCRyB3dTSoilRxwt7gG66VLF_MFC69uPn_z00pE2QzENzkYLPSoa4M32J |
		|            | JzDRKYx4xvM0PTvhfPXmwHIrMN9B4KMM45d_jqs45orKJfhNledgjlqYJCdb0BccP1H198zIbHe-hQ                            |
		| project_id | 964f00c0843c45be982b8898a722bd63                                                                          |
		| user_id    | 513f2b8c7e674cce8dca4002166b81a0                                                                          |
		+------------+-----------------------------------------------------------------------------------------------------------+
	
### 3.6 安装glance服务
### 3.6.1 配置glance数据库

	[root@opsnode1 ~]# mysql -u root -p
		MariaDB [(none)]> CREATE DATABASE glance;
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'localhost' IDENTIFIED BY 'glance';
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'%'   IDENTIFIED BY 'glance';

	[root@opsnode1 ~]# . admin-openrc

### 3.6.2 配置glance用户

	#创建 glance 用户
	[root@opsnode1 ~]# openstack user create --domain default --password-prompt glance
		User Password:apiglance
		Repeat User Password:apiglance
		+-----------+----------------------------------+
		| Field     | Value                            |
		+-----------+----------------------------------+
		| domain_id | e824551f502b4083aee78ca2392400ad |
		| enabled   | True                             |
		| id        | 0506e78d40bb4a469d928c8878ab0110 |
		| name      | glance                           |
		+-----------+----------------------------------+
	#添加admin角色到glance用户和service项目上
	[root@opsnode1 ~]# openstack role add --project service --user glance admin

### 3.6.3 创建glance服务实体
 	

	[root@opsnode1 ~]# openstack service create --name glance   --description "OpenStack Image" image
		+-------------+----------------------------------+
		| Field       | Value                            |
		+-------------+----------------------------------+
		| description | OpenStack Image                  |
		| enabled     | True                             |
		| id          | 3efcad9d64a74f49a33e1b3eb72d3a78 |
		| name        | glance                           |
		| type        | image                            |
		+-------------+----------------------------------+
		
### 3.6.4 创建镜像服务的 API 端点

	[root@opsnode1 ~]# openstack endpoint create --region RegionOne image public http://opsnode1.example.com:9292
		+--------------+----------------------------------+
		| Field        | Value                            |
		+--------------+----------------------------------+
		| enabled      | True                             |
		| id           | 1d22b7e0b67346a1bf1848a89c6c2977 |
		| interface    | public                           |
		| region       | RegionOne                        |
		| region_id    | RegionOne                        |
		| service_id   | 3efcad9d64a74f49a33e1b3eb72d3a78 |
		| service_name | glance                           |
		| service_type | image                            |
		| url          | http://opsnode1.example.com:9292 |
		+--------------+----------------------------------+
		
	[root@opsnode1 ~]# openstack endpoint create --region RegionOne image internal  http://opsnode1.example.com:9292
		+--------------+----------------------------------+
		| Field        | Value                            |
		+--------------+----------------------------------+
		| enabled      | True                             |
		| id           | 7e1f661101c442329e6df4e56566bb79 |
		| interface    | internal                         |
		| region       | RegionOne                        |
		| region_id    | RegionOne                        |
		| service_id   | 3efcad9d64a74f49a33e1b3eb72d3a78 |
		| service_name | glance                           |
		| service_type | image                            |
		| url          | http://opsnode1.example.com:9292 |
		+--------------+----------------------------------+
		
	[root@opsnode1 ~]# openstack endpoint create --region RegionOne image admin http://opsnode1.example.com:9292
		+--------------+----------------------------------+
		| Field        | Value                            |
		+--------------+----------------------------------+
		| enabled      | True                             |
		| id           | 49832a30b41043438166937c7eab3361 |
		| interface    | admin                            |
		| region       | RegionOne                        |
		| region_id    | RegionOne                        |
		| service_id   | 3efcad9d64a74f49a33e1b3eb72d3a78 |
		| service_name | glance                           |
		| service_type | image                            |
		| url          | http://opsnode1.example.com:9292 |
		+--------------+----------------------------------+

### 3.6.5 安装配置glance
	
	[root@opsnode1 ~]# yum install openstack-glance
	[root@opsnode1 ~]# vim /etc/glance/glance-api.conf
		[DEFAULT]
		//#配置 noop 禁用通知，因为他们只适合与可选的Telemetry 服务：
		//notification_driver = noop
		#启用详细日志
		verbose = True
		
		[database]
		#配置数据库访问(格式mysql+pymysql://用户名:密码@数据库地址/库名)
		connection = mysql+pymysql://glance:glance@opsnode1.example.com/glance
		
		[keystone_authtoken]
		#配置认证服务访问
		auth_uri = http://opsnode1.example.com:5000
		auth_url = http://opsnode1.example.com:35357
		memcached_servers = opsnode1.example.com:11211
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		project_name = service
		username = glance
		password = apiglance

		[paste_deploy]
		#认证服务访问为keystone
		flavor = keystone
		
		[glance_store]
		#配置本地文件系统存储和镜像文件位置
		stores = file,http
		default_store = file
		filesystem_store_datadir = /var/lib/glance/images/

	[root@opsnode1 ~]# vim  /etc/glance/glance-registry.conf
	
		[database]
		#配置数据库访问(格式mysql+pymysql://用户名:密码@数据库地址/库名)
		connection = mysql+pymysql://glance:glance@opsnode1.example.com/glance

		[keystone_authtoken]
		#配置认证服务访问
		auth_uri = http://opsnode1.example.com:5000
		auth_url = http://opsnode1.example.com:35357
		memcached_servers = opsnode1.example.com:11211
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		project_name = service
		username = glance
		password = apiglance

		[paste_deploy]
		flavor = keystone
	
	[root@opsnode1 ~]# su -s /bin/sh -c "glance-manage db_sync" glance
	[root@opsnode1 ~]# systemctl enable openstack-glance-api.service \
	openstack-glance-registry.service
	[root@opsnode1 ~]# systemctl start openstack-glance-api.service \
	openstack-glance-registry.service

### 3.6.6 验证操作

	[root@opsnode1 ~]# . admin-openrc	
	[root@opsnode1 ~]# wget http://download.cirros-cloud.net/0.3.4/cirros-0.3.4-x86_64-disk.img
	[root@opsnode1 ~]# openstack image create "cirros"  --file cirros-0.3.4-x86_64-disk.img --disk-format qcow2 --container-format bare --public
		+------------------+------------------------------------------------------+
		| Field            | Value                                                |
		+------------------+------------------------------------------------------+
		| checksum         | ee1eca47dc88f4879d8a229cc70a07c6                     |
		| container_format | bare                                                 |
		| created_at       | 2016-06-15T03:56:16Z                                 |
		| disk_format      | qcow2                                                |
		| file             | /v2/images/3eae8aeb-9eab-4b59-868d-7f25d97d260a/file |
		| id               | 3eae8aeb-9eab-4b59-868d-7f25d97d260a                 |
		| min_disk         | 0                                                    |
		| min_ram          | 0                                                    |
		| name             | cirros                                               |
		| owner            | 964f00c0843c45be982b8898a722bd63                     |
		| protected        | False                                                |
		| schema           | /v2/schemas/image                                    |
		| size             | 13287936                                             |
		| status           | active                                               |
		| tags             |                                                      |
		| updated_at       | 2016-06-15T03:56:17Z                                 |
		| virtual_size     | None                                                 |
		| visibility       | public                                               |
		+------------------+------------------------------------------------------+
	[root@opsnode1 ~]# openstack image list
		+--------------------------------------+--------+--------+
		| ID                                   | Name   | Status |
		+--------------------------------------+--------+--------+
		| 3eae8aeb-9eab-4b59-868d-7f25d97d260a | cirros | active |
		+--------------------------------------+--------+--------+
### 3.7 安装nova

### 3.7.1 控制节点安装：

### 3.7.1.1 配置nova数据库

	[root@opsnode1 ~]# mysql -u root -p
		MariaDB [(none)]> CREATE DATABASE nova_api;
		MariaDB [(none)]> CREATE DATABASE nova;
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON nova_api.* TO 'nova'@'localhost'  IDENTIFIED BY 'nova';
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON nova_api.* TO 'nova'@'%' IDENTIFIED BY 'nova';
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'localhost' IDENTIFIED BY 'nova';
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'%'  IDENTIFIED BY 'nova';

### 3.7.1.2 配置用户和角色

	[root@opsnode1 ~]# . admin-openrc	
	#创建 nova 用户
	[root@opsnode1 ~]# openstack user create --domain default  --password-prompt nova
		User Password:apinova
		Repeat User Password:apinova
		+-----------+----------------------------------+
		| Field     | Value                            |
		+-----------+----------------------------------+
		| domain_id | e824551f502b4083aee78ca2392400ad |
		| enabled   | True                             |
		| id        | fe1f3131fb6c4437ad8b91666a357dc1 |
		| name      | nova                             |
		+-----------+----------------------------------+
	#添加admin 角色到 nova 用户
	[root@opsnode1 ~]# openstack role add --project service --user nova admin

### 3.7.1.3 创建nova服务实体
	
	[root@opsnode1 ~]# openstack service create --name nova   --description "OpenStack Compute" compute
		+-------------+----------------------------------+
		| Field       | Value                            |
		+-------------+----------------------------------+
		| description | OpenStack Compute                |
		| enabled     | True                             |
		| id          | 7cbae2cd1f6040b493d6fc5f74ff9d1b |
		| name        | nova                             |
		| type        | compute                          |
		+-------------+----------------------------------+

### 3.7.1.4 创建计算服务API端点

	[root@opsnode1 ~]# openstack endpoint create --region RegionOne  compute public http://opsnode1.example.com:8774/v2.1/%\(tenant_id\)s
		+--------------+-----------------------------------------------------+
		| Field        | Value                                               |
		+--------------+-----------------------------------------------------+
		| enabled      | True                                                |
		| id           | 8365a2b437a746278ecaca3c54b1f616                    |
		| interface    | public                                              |
		| region       | RegionOne                                           |
		| region_id    | RegionOne                                           |
		| service_id   | 7cbae2cd1f6040b493d6fc5f74ff9d1b                    |
		| service_name | nova                                                |
		| service_type | compute                                             |
		| url          | http://opsnode1.example.com:8774/v2.1/%(tenant_id)s |
		+--------------+-----------------------------------------------------+
		
	[root@opsnode1 ~]# openstack endpoint create --region RegionOne   compute internal http://opsnode1.example.com:8774/v2.1/%\(tenant_id\)s
		+--------------+-----------------------------------------------------+
		| Field        | Value                                               |
		+--------------+-----------------------------------------------------+
		| enabled      | True                                                |
		| id           | 7513bc4bb26b4be49251205adc07ab5b                    |
		| interface    | internal                                            |
		| region       | RegionOne                                           |
		| region_id    | RegionOne                                           |
		| service_id   | 7cbae2cd1f6040b493d6fc5f74ff9d1b                    |
		| service_name | nova                                                |
		| service_type | compute                                             |
		| url          | http://opsnode1.example.com:8774/v2.1/%(tenant_id)s |
		+--------------+-----------------------------------------------------+
		
	[root@opsnode1 ~]# openstack endpoint create --region RegionOne  compute admin http://opsnode1.example.com:8774/v2.1/%\(tenant_id\)s
		+--------------+-----------------------------------------------------+
		| Field        | Value                                               |
		+--------------+-----------------------------------------------------+
		| enabled      | True                                                |
		| id           | a5e38483f8c848e2a3d4226fabfd4bb3                    |
		| interface    | admin                                               |
		| region       | RegionOne                                           |
		| region_id    | RegionOne                                           |
		| service_id   | 7cbae2cd1f6040b493d6fc5f74ff9d1b                    |
		| service_name | nova                                                |
		| service_type | compute                                             |
		| url          | http://opsnode1.example.com:8774/v2.1/%(tenant_id)s |
		+--------------+-----------------------------------------------------+

### 3.7.1.5 配置安装服务组件

	[root@opsnode1 ~]# yum install openstack-nova-api openstack-nova-conductor \
		openstack-nova-console openstack-nova-novncproxy  openstack-nova-scheduler
	[root@opsnode1 ~]# vim /etc/nova/nova.conf
		[DEFAULT]
		enabled_apis = osapi_compute,metadata
		#使用RabbitMQ消息队列
		rpc_backend = rabbit
		#使用认证服务keystone
		auth_strategy = keystone
		#配置变量$my_ip
		my_ip = 172.16.10.11
		#启用网络服务支持
		use_neutron = True
		firewall_driver = nova.virt.firewall.NoopFirewallDriver
		
		service_metadata_proxy = True
		#注意metadatascere为网络节点的metadata_proxy_shared_secret
		metadata_proxy_shared_secret = metadatascere
		verbose = True
		
		[api_database]
		#配置数据库访问
		connection = mysql+pymysql://nova:nova@opsnode1.example.com/nova_api
		
		[database]
		connection = mysql+pymysql://nova:nova@opsnode1.example.com/nova
		
		[oslo_messaging_rabbit]
		#配置RabbitMQ消息队列访问
		rabbit_host = opsnode1.example.com
		rabbit_userid = openstack
		rabbit_password = openstack
		
		[keystone_authtoken]
		#配置认证服务访问
		auth_uri = http://opsnode1.example.com:5000
		auth_url = http://opsnode1.example.com:35357
		memcached_servers = opsnode1.example.com:11211
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		project_name = service
		username = nova
		password = apinova
	
		[vnc]
		#配置VNC代理使用控制节点的管理IP地址
		vncserver_listen = $my_ip
		vncserver_proxyclient_address = $my_ip

		[glance]
		#配置镜像服务的位置
		api_servers = http://opsnode1.example.com:9292
	
		[oslo_concurrency]
		#配置锁路径
		lock_path = /var/lib/nova/tmp
	[root@opsnode1 ~]# su -s /bin/sh -c "nova-manage api_db sync" nova
	[root@opsnode1 ~]# su -s /bin/sh -c "nova-manage db sync" nova
	[root@opsnode1 ~]# systemctl enable openstack-nova-api.service   \
		openstack-nova-consoleauth.service openstack-nova-scheduler.service  \
		openstack-nova-conductor.service openstack-nova-novncproxy.service
	[root@opsnode1 ~]# systemctl start openstack-nova-api.service  \
		openstack-nova-consoleauth.service openstack-nova-scheduler.service  \
		openstack-nova-conductor.service openstack-nova-novncproxy.service

	
### 3.7.2 计算节点安装与配置

### 3.7.2.1 配置内核参数

	#配置内核参数，不知道是否有效
	[root@opsnode2 ~]# vim /etc/sysctl.conf
		net.ipv4.conf.all.rp_filter = 0
		net.ipv4.conf.default.rp_filter = 0
	[root@opsnode2 ~]#  sysctl -p	

### 3.7.2.2 配置安装服务组件
	
	[root@opsnode2 ~]# yum install openstack-nova-compute
	[root@opsnode2 ~]# vim /etc/nova/nova.conf
		[DEFAULT]
		rpc_backend = rabbit
		auth_strategy = keystone
		my_ip = 172.16.10.12
		use_neutron = True
		firewall_driver = nova.virt.firewall.NoopFirewallDriver
	
		[oslo_messaging_rabbit]
		rabbit_host = opsnode1.example.com
		rabbit_userid = openstack
		rabbit_password = openstack
		
		[keystone_authtoken]
		auth_uri = http://opsnode1.example.com:5000
		auth_url = http://opsnode1.example.com:35357
		memcached_servers = opsnode1.example.com:11211
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		project_name = service
		username = nova
		password = apinova
	
		[vnc]
		enabled = True
		vncserver_listen = 0.0.0.0
		vncserver_proxyclient_address = $my_ip
		novncproxy_base_url = http://opsnode1.example.com:6080/vnc_auto.html
	
		[glance]
		api_servers = http://opsnode1.example.com:9292
	
		[oslo_concurrency]
		lock_path = /var/lib/nova/tmp
		
		[libvirt]
		virt_type = kvm
		#如果是虚拟机下实验就改为qemu
	
	[root@opsnode2 ~]# systemctl enable libvirtd.service openstack-nova-compute.service
	[root@opsnode2 ~]# systemctl start libvirtd.service openstack-nova-compute.service

### 3.7.3 操作验证

	[root@opsnode1 ~]# . admin-openrc
	[root@opsnode1 ~]# openstack compute service list
	
	
### 3.8 安装neutron	

### 3.8.1 在控制节点上安装

### 3.8.1.1 配置neutron数据库

	[root@opsnode1 ~]# mysql -u root -p
		MariaDB [(none)]> CREATE DATABASE neutron;
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON neutron.* TO 'neutron'@'localhost'  IDENTIFIED BY 'neutron';
		MariaDB [(none)]> GRANT ALL PRIVILEGES ON neutron.* TO 'neutron'@'%'  IDENTIFIED BY 'neutron';

### 3.8.1.2 配置用户和角色
	[root@opsnode1 ~]# . admin-openrc
	[root@opsnode1 ~]# openstack user create --domain default --password-prompt neutron
		User Password:apineutron
		Repeat User Password:apineutron
		+-----------+----------------------------------+
		| Field     | Value                            |
		+-----------+----------------------------------+
		| domain_id | e824551f502b4083aee78ca2392400ad |
		| enabled   | True                             |
		| id        | 835062c56ab341369b240e8dabc7203d |
		| name      | neutron                          |
		+-----------+----------------------------------+
	[root@opsnode1 ~]# openstack role add --project service --user neutron admin

### 3.8.1.3 创建服务实体

	[root@opsnode1 ~]# openstack service create --name neutron   --description "OpenStack Networking" network
		+-------------+----------------------------------+
		| Field       | Value                            |
		+-------------+----------------------------------+
		| description | OpenStack Networking             |
		| enabled     | True                             |
		| id          | be48ffe3253a431586bef46a02ca2f8d |
		| name        | neutron                          |
		| type        | network                          |
		+-------------+----------------------------------+

### 3.8.1.4 创建API端点

	[root@opsnode1 ~]# openstack endpoint create --region RegionOne  network public http://opsnode1.example.com:9696
		+--------------+----------------------------------+
		| Field        | Value                            |
		+--------------+----------------------------------+
		| enabled      | True                             |
		| id           | f5aab86fdf7c411eb905ab8547c2bb9e |
		| interface    | public                           |
		| region       | RegionOne                        |
		| region_id    | RegionOne                        |
		| service_id   | be48ffe3253a431586bef46a02ca2f8d |
		| service_name | neutron                          |
		| service_type | network                          |
		| url          | http://opsnode1.example.com:9696 |
		+--------------+----------------------------------+
		
	[root@opsnode1 ~]# openstack endpoint create --region RegionOne  network internal http://opsnode1.example.com:9696
		+--------------+----------------------------------+
		| Field        | Value                            |
		+--------------+----------------------------------+
		| enabled      | True                             |
		| id           | a9a5a4b0bfa240e2957d2b8635d0a17b |
		| interface    | internal                         |
		| region       | RegionOne                        |
		| region_id    | RegionOne                        |
		| service_id   | be48ffe3253a431586bef46a02ca2f8d |
		| service_name | neutron                          |
		| service_type | network                          |
		| url          | http://opsnode1.example.com:9696 |
		+--------------+----------------------------------+
	
	[root@opsnode1 ~]# openstack endpoint create --region RegionOne  network admin http://opsnode1.example.com:9696
		+--------------+----------------------------------+
		| Field        | Value                            |
		+--------------+----------------------------------+
		| enabled      | True                             |
		| id           | 3aa24f52c2cf4c2d8bb25914ddd763c4 |
		| interface    | admin                            |
		| region       | RegionOne                        |
		| region_id    | RegionOne                        |
		| service_id   | be48ffe3253a431586bef46a02ca2f8d |
		| service_name | neutron                          |
		| service_type | network                          |
		| url          | http://opsnode1.example.com:9696 |
		+--------------+----------------------------------+
	
		
### 3.8.1.5 配置安装服务组件
		
	[root@opsnode1 ~]# yum install openstack-neutron openstack-neutron-ml2 openstack-neutron-linuxbridge ebtables
	[root@opsnode1 ~]# vim /etc/neutron/neutron.conf
		#配置数据库连接
		[database]
		connection = mysql+pymysql://neutron:neutron@opsnode1.example.com/neutron
		
		[DEFAULT]
		core_plugin = ml2
		service_plugins = router
		allow_overlapping_ips = True
		rpc_backend = rabbit	
		#使用RabbitMQ消息队列
		auth_strategy = keystone 
		#使用keystone身份服务认证
		
		#开启网络通知计算网络拓扑变化	
		notify_nova_on_port_status_changes = True
		notify_nova_on_port_data_changes = True

		#配置RabbitMQ消息队列访问参数，api地址与帐号密码
		[oslo_messaging_rabbit]
		rabbit_host = opsnode1.example.com
		rabbit_userid = openstack
		rabbit_password = openstack
	
		#身份服务访问参数api地址、帐号与密码	
		[keystone_authtoken]
		auth_uri = http://opsnode1.example.com:5000
		auth_url = http://opsnode1.example.com:35357
		memcached_servers = opsnode1.example.com:11211
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		project_name = service
		username = neutron
		password = apineutron

		#配置网络通知计算网络拓扑变化参数api地址、帐号与密码			
		[nova]
		auth_url = http://opsnode1.example.com:35357
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		region_name = RegionOne
		project_name = service
		username = nova
		password = apinova

		#配置锁路径		
		[oslo_concurrency]
		lock_path = /var/lib/neutron/tmp
		
	[root@opsnode1 ~]# vim /etc/neutron/plugins/ml2/ml2_conf.ini	
	
		[ml2]
		#支持的网络驱动	
		type_drivers = flat,vlan,vxlan 
		#使用的网络类型
		tenant_network_types = vxlan  
		#启用端口安全
		extension_drivers = port_security 
		#底层驱动为linuxbridge,l2population
		mechanism_drivers = linuxbridge,l2population

		[ml2_type_flat]
		#配置扁平网络供应商，可以有多个provider,provider和physical_interface_mappings的值相对应。
		flat_networks = provider
		
		[ml2_type_vxlan]
		#配置VXLAN网络标识符范围
		vni_ranges = 1:1000

		#使ipset提高效率的安全组规则
		[securitygroup]
		enable_ipset = True
	
	[root@opsnode1 ~]# vim /etc/nova/nova.conf
		#配置访问neutron参数
		[neutron]
		url = http://opsnode1.example.com:9696
		auth_url = http://opsnode1.example.com:35357
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		region_name = RegionOne
		project_name = service
		username = neutron
		password = apineutron
		service_metadata_proxy = True
	
	[root@opsnode1 ~]# ln -s /etc/neutron/plugins/ml2/ml2_conf.ini /etc/neutron/plugin.ini
	#同步数据库
	[root@opsnode1 ~]# su -s /bin/sh -c "neutron-db-manage --config-file /etc/neutron/neutron.conf   --config-file /etc/neutron/plugins/ml2/ml2_conf.ini upgrade head" neutron
	[root@opsnode1 ~]# systemctl restart openstack-nova-api.service
	[root@opsnode1 ~]# systemctl enable neutron-linuxbridge-agent.service neutron-server.service
	[root@opsnode1 ~]# systemctl start neutron-server.service
	
	
### 3.8.2 网络节点上安装

### 3.8.2.1 调整内核参数

	[root@opsnode3 ~]# vim /etc/sysctl.conf
		net.ipv4.ip_forward=1
	    net.ipv4.conf.all.rp_filter=0
		net.ipv4.conf.default.rp_filter=0
	[root@opsnode3 ~]#  sysctl -p

### 3.8.2.2 配置安装服务组件

	[root@opsnode3 ~]# yum install openstack-neutron openstack-neutron-ml2 openstack-neutron-linuxbridge ebtables	
	[root@opsnode3 ~]# vim /etc/neutron/neutron.conf
		[DEFAULT]
		core_plugin = ml2
		service_plugins = router
		allow_overlapping_ips = True
		rpc_backend = rabbit
		auth_strategy = keystone
		notify_nova_on_port_status_changes = True
		notify_nova_on_port_data_changes = True
		
		#配置RabbitMQ消息队列访问参数，api地址与帐号密码
		[oslo_messaging_rabbit]
		rabbit_host = opsnode1.example.com
		rabbit_userid = openstack
		rabbit_password = openstack
		
		#身份服务访问参数api地址、帐号与密码	
		[keystone_authtoken]
		auth_uri = http://opsnode1.example.com:5000
		auth_url = http://opsnode1.example.com:35357
		memcached_servers = opsnode1.example.com:11211
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		project_name = service
		username = neutron
		password = apineutron

		#配置网络通知计算网络拓扑变化参数api地址、帐号与密码			
		[nova]
		auth_url = http://opsnode1.example.com:35357
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		region_name = RegionOne
		project_name = service
		username = nova
		password = apinova

		#配置锁路径		
		[oslo_concurrency]
		lock_path = /var/lib/neutron/tmp
		
	[root@opsnode3 ~]# vim /etc/neutron/plugins/ml2/ml2_conf.ini
		
		[ml2]
		type_drivers = flat,vlan,vxlan 
		#使用扁平化网络、VLAN网络和VXLAN网络
		tenant_network_types = vxlan  
		#使VXLAN自助服务网络
		extension_drivers = port_security 
		#启用端口安全
		mechanism_drivers = linuxbridge,l2population
		#使Linux桥和2层人口机制
		
		#配置扁平网络供应商
		[ml2_type_flat]
		flat_networks = provider
		
		#配置VXLAN网络标识符范围
		[ml2_type_vxlan]
		vni_ranges = 1:1000

		#使ipset提高效率的安全组规则
		[securitygroup]
		enable_ipset = True
	
	[root@opsnode3 ~]# vim /etc/neutron/plugins/ml2/linuxbridge_agent.ini
		
		[linux_bridge]
		#physical_interface_mappings用来把名字和该网络使用的物理网卡对应起来。也就是虚拟机使用这个网卡与外界通讯，可以设置多个。
		physical_interface_mappings = provider:enp0s9
		
		[vxlan]
		enable_vxlan = True
		#local_ip为实例通讯的网络IP
		local_ip = 192.16.20.13
		l2_population = True
		
		[securitygroup]
		enable_security_group = True
		firewall_driver = neutron.agent.linux.iptables_firewall.IptablesFirewallDriver
	
	[root@opsnode3 ~]# vim /etc/neutron/l3_agent.ini
		[DEFAULT]
		interface_driver = neutron.agent.linux.interface.BridgeInterfaceDriver
		external_network_bridge =
		#注意external_network_bridge故意不包含值,external_network_bridge区域故意缺少值是为了在一个单点agent上启用多个外部网络。

	[root@opsnode3 ~]# vim /etc/neutron/dhcp_agent.ini
		[DEFAULT]
		interface_driver = neutron.agent.linux.interface.BridgeInterfaceDriver
		dhcp_driver = neutron.agent.linux.dhcp.Dnsmasq
		enable_isolated_metadata = True
	
	[root@opsnode3 ~]# vim /etc/neutron/metadata_agent.ini
		[DEFAULT]
		nova_metadata_ip=opsnode1.example.com
		metadata_proxy_shared_secret=metadatasceret
		#这里假定neutron服务的keystone帐号密码为neutron_pass,且在控制节点上配置的metadata_proxy_shared_secret为metadatasceret
	[root@opsnode3 ~]# ln -s /etc/neutron/plugins/ml2/ml2_conf.ini /etc/neutron/plugin.ini
	[root@opsnode3 ~]# systemctl enable   neutron-linuxbridge-agent.service neutron-dhcp-agent.service neutron-metadata-agent.service neutron-l3-agent.service
	[root@opsnode3 ~]# systemctl start neutron-linuxbridge-agent.service neutron-dhcp-agent.service neutron-metadata-agent.service neutron-l3-agent.service

### 3.8.3 计算节点安装

### 3.8.3.1 配置内核参数

	[root@opsnode2 ~]# vim /etc/sysctl.conf
		net.ipv4.conf.all.rp_filter = 0
		net.ipv4.conf.default.rp_filter = 0
	[root@opsnode2 ~]#  sysctl -p

### 3.8.3.2 配置安装服务组件

	[root@opsnode2 ~]# yum install openstack-neutron-linuxbridge ebtables	
	[root@opsnode2 ~]# vim /etc/neutron/neutron.conf
		[DEFAULT]
		rpc_backend = rabbit
		auth_strategy = keystone
		
		[oslo_messaging_rabbit]
		rabbit_host = opsnode1.example.com
		rabbit_userid = openstack
		rabbit_password = openstack
	
		[keystone_authtoken]
		auth_uri = http://opsnode1.example.com:5000
		auth_url = http://opsnode1.example.com:35357
		memcached_servers = opsnode1.example.com:11211
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		project_name = service
		username = neutron
		password = apineutron
	
		[oslo_concurrency]
		lock_path = /var/lib/neutron/tmp
		
	[root@opsnode2 ~]# vim /etc/neutron/plugins/ml2/linuxbridge_agent.ini 
		[linux_bridge]
		physical_interface_mappings = provider:enp0s9
		注意这里是连接外网的网卡

		[vxlan]
		enable_vxlan = True
		local_ip = 192.16.20.12
		l2_population = True

		[securitygroup]
		enable_security_group = True
		firewall_driver = neutron.agent.linux.iptables_firewall.IptablesFirewallDriver
	
	[root@opsnode2 ~]# vim /etc/nova/nova.conf
		[neutron]
		url = http://opsnode1.example.com:9696
		auth_url = http://opsnode1.example.com:35357
		auth_type = password
		project_domain_name = default
		user_domain_name = default
		region_name = RegionOne
		project_name = service
		username = neutron
		password = apineutron
		service_metadata_proxy = True
	[root@opsnode2 ~]# systemctl restart openstack-nova-compute.service
	[root@opsnode2 ~]# systemctl enable neutron-linuxbridge-agent.service
	[root@opsnode2 ~]# systemctl start neutron-linuxbridge-agent.service

### 3.8.4 创建网络
	注意，必须先provider network，然后才能
	
### 3.8.4.1 创建供应商网络
	[root@opsnode1 ~]# neutron net-create --shared --provider:physical_network provider --provider:network_type flat provider
	
			Created a new network:
			+---------------------------+--------------------------------------+
			| Field                     | Value                                |
			+---------------------------+--------------------------------------+
			| admin_state_up            | True                                 |
			| availability_zone_hints   |                                      |
			| availability_zones        |                                      |
			| created_at                | 2016-06-16T10:33:11                  |
			| description               |                                      |
			| id                        | 8dc91652-95f0-406d-9613-2c8d9fa53657 |
			| ipv4_address_scope        |                                      |
			| ipv6_address_scope        |                                      |
			| mtu                       | 1500                                 |
			| name                      | provider                             |
			| port_security_enabled     | True                                 |
			| provider:network_type     | flat                                 |
			| provider:physical_network | provider                             |
			| provider:segmentation_id  |                                      |
			| router:external           | False                                |
			| shared                    | True                                 |
			| status                    | ACTIVE                               |
			| subnets                   |                                      |
			| tags                      |                                      |
			| tenant_id                 | 964f00c0843c45be982b8898a722bd63     |
			| updated_at                | 2016-06-16T10:33:11                  |
			+---------------------------+--------------------------------------+
	
	[root@opsnode2 ~]# neutron subnet-create --name provider --allocation-pool start=192.168.8.211,end=192.168.8.222 --dns-nameserver 114.114.114.114 --gateway 192.168.8.1 provider 192.168.8.0/24
			Created a new subnet:
			+-------------------+----------------------------------------------------+
			| Field             | Value                                              |
			+-------------------+----------------------------------------------------+
			| allocation_pools  | {"start": "192.168.8.211", "end": "192.168.8.222"} |
			| cidr              | 192.168.8.0/24                                     |
			| created_at        | 2016-06-16T10:39:53                                |
			| description       |                                                    |
			| dns_nameservers   | 114.114.114.114                                    |
			| enable_dhcp       | True                                               |
			| gateway_ip        | 192.168.8.1                                        |
			| host_routes       |                                                    |
			| id                | ce8ca87a-2b34-4e15-8fbd-1e23d719108e               |
			| ip_version        | 4                                                  |
			| ipv6_address_mode |                                                    |
			| ipv6_ra_mode      |                                                    |
			| name              | provider                                           |
			| network_id        | 8dc91652-95f0-406d-9613-2c8d9fa53657               |
			| subnetpool_id     |                                                    |
			| tenant_id         | 964f00c0843c45be982b8898a722bd63                   |
			| updated_at        | 2016-06-16T10:39:53                                |
			+-------------------+----------------------------------------------------+
					
### 3.8.4.2 创建自助网络

	[root@opsnode1 ~]# . admin-openrc
	[root@opsnode1 ~]# nova flavor-list
	#列出实例类型
			+----+-----------+-----------+------+-----------+------+-------+-------------+-----------+
			| ID | Name      | Memory_MB | Disk | Ephemeral | Swap | VCPUs | RXTX_Factor | Is_Public |
			+----+-----------+-----------+------+-----------+------+-------+-------------+-----------+
			| 1  | m1.tiny   | 512       | 1    | 0         |      | 1     | 1.0         | True      |
			| 2  | m1.small  | 2048      | 20   | 0         |      | 1     | 1.0         | True      |
			| 3  | m1.medium | 4096      | 40   | 0         |      | 2     | 1.0         | True      |
			| 4  | m1.large  | 8192      | 80   | 0         |      | 4     | 1.0         | True      |
			| 5  | m1.xlarge | 16384     | 160  | 0         |      | 8     | 1.0         | True      |
			+----+-----------+-----------+------+-----------+------+-------+-------------+-----------+
	[root@opsnode1 ~]# nova image-list
	#列出可用镜像
			+--------------------------------------+--------+--------+--------+
			| ID                                   | Name   | Status | Server |
			+--------------------------------------+--------+--------+--------+
			| 3eae8aeb-9eab-4b59-868d-7f25d97d260a | cirros | ACTIVE |        |
			+--------------------------------------+--------+--------+--------+
	[root@opsnode1 ~]# neutron net-list
	#列出代理以验证启动 neutron 代理是否成功
	[root@opsnode1 ~]# neutron agent-list
		
	[root@opsnode1 ~]# neutron net-create selfservice
	#添加网络selfservice
		Created a new network:
			+---------------------------+--------------------------------------+
			| Field                     | Value                                |
			+---------------------------+--------------------------------------+
			| admin_state_up            | True                                 |
			| availability_zone_hints   |                                      |
			| availability_zones        |                                      |
			| created_at                | 2016-06-16T10:04:31                  |
			| description               |                                      |
			| id                        | a5505308-d67b-43ae-aa44-532b4cd4e579 |
			| ipv4_address_scope        |                                      |
			| ipv6_address_scope        |                                      |
			| mtu                       | 1450                                 |
			| name                      | selfservice                          |
			| port_security_enabled     | True                                 |
			| provider:network_type     | vxlan                                |
			| provider:physical_network |                                      |
			| provider:segmentation_id  | 16                                   |
			| router:external           | False                                |
			| shared                    | False                                |
			| status                    | ACTIVE                               |
			| subnets                   |                                      |
			| tags                      |                                      |
			| tenant_id                 | 964f00c0843c45be982b8898a722bd63     |
			| updated_at                | 2016-06-16T10:04:31                  |
			+---------------------------+--------------------------------------+

	[root@opsnode1 ~]# neutron subnet-create --name selfservice --allocation-pool \
		start=10.199.200.100,end=10.199.200.200   --dns-nameserver 10.199.200.1 --gateway 10.199.200.1  \
		selfservice 10.199.200.0/24
	#创建子网
		Created a new subnet:
			+-------------------+------------------------------------------------------+
			| Field             | Value                                                |
			+-------------------+------------------------------------------------------+
			| allocation_pools  | {"start": "10.199.200.100", "end": "10.199.200.200"} |
			| cidr              | 10.199.200.0/24                                      |
			| created_at        | 2016-06-16T10:42:32                                  |
			| description       |                                                      |
			| dns_nameservers   | 10.199.200.1                                         |
			| enable_dhcp       | True                                                 |
			| gateway_ip        | 10.199.200.1                                         |
			| host_routes       |                                                      |
			| id                | 7893b87c-6467-4c1f-9147-f15ef14e4b21                 |
			| ip_version        | 4                                                    |
			| ipv6_address_mode |                                                      |
			| ipv6_ra_mode      |                                                      |
			| name              | selfservice                                          |
			| network_id        | a5505308-d67b-43ae-aa44-532b4cd4e579                 |
			| subnetpool_id     |                                                      |
			| tenant_id         | 964f00c0843c45be982b8898a722bd63                     |
			| updated_at        | 2016-06-16T10:42:32                                  |
			+-------------------+------------------------------------------------------+


			
	[root@opsnode1 ~]# openstack network list
	#保证有以下两个网络
			+--------------------------------------+-------------+--------------------------------------+
			| ID                                   | Name        | Subnets                              |
			+--------------------------------------+-------------+--------------------------------------+
			| 8dc91652-95f0-406d-9613-2c8d9fa53657 | provider    | ce8ca87a-2b34-4e15-8fbd-1e23d719108e |
			| a5505308-d67b-43ae-aa44-532b4cd4e579 | selfservice | 7893b87c-6467-4c1f-9147-f15ef14e4b21 |
			+--------------------------------------+-------------+--------------------------------------+


	[root@opsnode1 ~]# # neutron net-update provider --router:external
	#添加路由到供应商网络
	[root@opsnode1 ~]# . demo-openrc
	[root@opsnode1 ~]# neutron router-create router
	#创建路由
		Created a new router:
			+-------------------------+--------------------------------------+
			| Field                   | Value                                |
			+-------------------------+--------------------------------------+
			| admin_state_up          | True                                 |
			| availability_zone_hints |                                      |
			| availability_zones      |                                      |
			| description             |                                      |
			| external_gateway_info   |                                      |
			| id                      | f97c030a-b885-4685-ae37-4613ca859ea1 |
			| name                    | router                               |
			| routes                  |                                      |
			| status                  | ACTIVE                               |
			| tenant_id               | 70622483fbe243b5bb96facbe41b7139     |
			+-------------------------+--------------------------------------+

	[root@opsnode1 ~]#. admin-openrc	
	[root@opsnode1 ~]# neutron router-interface-add router selfservice
	# 添加一个接口从route到selfservice子网
	[root@opsnode1 ~]# neutron router-gateway-set router provider
	#设置网关

### 3.8.4 验证操作

	[root@opsnode1 ~]# . admin-openrc
	[root@opsnode1 ~]# neutron ext-list
		+---------------------------+-----------------------------------------------+
		| alias                     | name                                          |
		+---------------------------+-----------------------------------------------+
		| default-subnetpools       | Default Subnetpools                           |
		| network-ip-availability   | Network IP Availability                       |
		| network_availability_zone | Network Availability Zone                     |
		| auto-allocated-topology   | Auto Allocated Topology Services              |
		| ext-gw-mode               | Neutron L3 Configurable external gateway mode |
		| binding                   | Port Binding                                  |
		| agent                     | agent                                         |
		| subnet_allocation         | Subnet Allocation                             |
		| l3_agent_scheduler        | L3 Agent Scheduler                            |
		| tag                       | Tag support                                   |
		| external-net              | Neutron external network                      |
		| net-mtu                   | Network MTU                                   |
		| availability_zone         | Availability Zone                             |
		| quotas                    | Quota management support                      |
		| l3-ha                     | HA Router extension                           |
		| provider                  | Provider Network                              |
		| multi-provider            | Multi Provider Network                        |
		| address-scope             | Address scope                                 |
		| extraroute                | Neutron Extra Route                           |
		| timestamp_core            | Time Stamp Fields addition for core resources |
		| router                    | Neutron L3 Router                             |
		| extra_dhcp_opt            | Neutron Extra DHCP opts                       |
		| dns-integration           | DNS Integration                               |
		| security-group            | security-group                                |
		| dhcp_agent_scheduler      | DHCP Agent Scheduler                          |
		| router_availability_zone  | Router Availability Zone                      |
		| rbac-policies             | RBAC Policies                                 |
		| standard-attr-description | standard-attr-description                     |
		| port-security             | Port Security                                 |
		| allowed-address-pairs     | Allowed Address Pairs                         |
		| dvr                       | Distributed Virtual Router                    |
		+---------------------------+-----------------------------------------------+


### 3.9 安装配置web界面

### 3.9.1 配置安装服务组件

	[root@opsnode1 ~]# yum install openstack-dashboard
	[root@opsnode1 ~]# vim /etc/openstack-dashboard/local_settings
		OPENSTACK_HOST = "opsnode1.example.com"
		ALLOWED_HOSTS = ['*', ]
		
		SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
		CACHES = {
			'default': {
				'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
				'LOCATION': 'opsnode1.example.com:11211',
				}
		}
		
		OPENSTACK_KEYSTONE_URL = "http://%s:5000/v3" % OPENSTACK_HOST
		
		OPENSTACK_KEYSTONE_MULTIDOMAIN_SUPPORT = True
		
		OPENSTACK_API_VERSIONS = {
			"identity": 3,
			"image": 2,
			"volume": 2,
		}
		
		OPENSTACK_KEYSTONE_DEFAULT_DOMAIN = "default"
		
		OPENSTACK_KEYSTONE_DEFAULT_ROLE = "user"
		
		#如果配置是供应商网络，则使用下面参数	
		OPENSTACK_NEUTRON_NETWORK = {
			...
			'enable_router': False,
			'enable_quotas': False,
			'enable_distributed_router': False,
			'enable_ha_router': False,
			'enable_lb': False,
			'enable_firewall': False,
			'enable_vpn': False,
			'enable_fip_topology_check': False,
		}
		
		TIME_ZONE = "Asia/Shanghai"
		
	[root@opsnode1 ~]# systemctl restart httpd.service memcached.service

### 3.9.2 验证操作

使用浏览器打开网址http://controller/dashboard即可访问dashboard.

验证使用 admin 或者demo用户凭证和default域凭证。	

---	
## 结束