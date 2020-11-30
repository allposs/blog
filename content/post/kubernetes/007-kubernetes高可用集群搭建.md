---
title:          007-kubernetes高可用集群搭建(生产标准)
date:           2020-11-26T10:23:04+08:00
draft:          true
tags:           [2020-11]
topics:         [kubernetes高可用集群,生产集群]
---
## 简介

<!--more-->
## 环境

|序号|主机名称|kubenetes集群类型|keepalived角色|IP地址|组件|IP地址|
|--|--|--|--|--|--|--|
|1|Node1|master|BACKUP|172.20.0.111|haproxy,keepalive,etcd,kubelet,kubeadm,docker,kube-apiserver,kube-scheduler,kube-proxy|172.20.0.111,10.0.2.15|
|2|Node2|master|BACKUP|172.20.0.112|haproxy,keepalive,etcd,kubelet,kubeadm,docker|172.20.0.112,10.0.2.15|
|3|Node3|master|BACKUP|172.20.0.113|haproxy,keepalive,etcd,kubelet,kubeadm,docker|172.20.0.113,10.0.2.15|
|4|Node4|node|--|172.20.0.114|kubelet,docker|172.20.0.114,10.0.2.15|
|5|Node5|node|--|172.20.0.115|kubelet,docker|172.20.0.115,10.0.2.15|
|6|Node6|harbor|--|172.20.0.116|docker,docker-compose|172.20.0.116,10.0.2.15|
|7|Node7|harbor|--|172.20.0.117|docker,docker-compose|172.20.0.117,10.0.2.15|

## 软件包




## 拓扑图


## 正文
---


### 1. 系统初始化(所有主机)

&nbsp;&nbsp;&nbsp;&nbsp;这一部分内容主要是做一些集群安装前的准备工作,由于环境的不同操作的方式也有所不同,大家可以根据个人情况进行调整。

    // 系统更新,除了内核(无法联通外网可以忽略)
    # yum --exclude=kernel* update -y
    // 安装红帽yum源(无法联通外网可以忽略)
    # yum install epel-release -y
    // 安装基本工具(个人喜好)
    # yum install bash-com* net-tools sysstat vim wget telnet -y
    // 检查并删除预装的docker
    # yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine  -y
    // 通过yum源安装最新的docker
    # yum install -y yum-utils device-mapper-persistent-data lvm2 -y
    //官方源
    # yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo -y
    //阿里源
    # yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    # yum install docker-ce -y
    // vagrang用户加入docker组
    # usermod -aG docker vagrant
    // 关闭swap,删除swap分区挂载,关闭防火墙，关闭selinux
    # swapoff -a && sysctl -w vm.swappiness=0 && systemctl stop firewalld && systemctl disable firewalld && setenforce 0 && sed -i 's/SELINUX=permissive/SELINUX=disabled/' /etc/selinux/config && sed -i '/swap/s/^/#/' /etc/fstab
    //启动docker
    # systemctl enable docker && systemctl start docker
    //内核参数配置
    # cat <<EOF > /etc/sysctl.d/k8s.conf
    # 包转发开启
    net.ipv4.ip_forward = 1
    # 网络包过滤方式：iptables
    net.bridge.bridge-nf-call-ip6tables = 1
    net.bridge.bridge-nf-call-iptables = 1
    EOF
    # sysctl -p /etc/sysctl.d/k8s.conf
    //配置ipvs需要的内核模块 
    # cat > /etc/sysconfig/modules/ipvs.modules <<EOF
    #!/bin/bash
    modprobe -- br_netfilter
    modprobe -- ip_vs
    modprobe -- ip_vs_rr
    modprobe -- ip_vs_wrr
    modprobe -- ip_vs_sh
    modprobe -- nf_conntrack_ipv4
    EOF
    # chmod 755 /etc/sysconfig/modules/ipvs.modules && bash /etc/sysconfig/modules/ipvs.modules && lsmod | grep -E "ip_vs|nf_conntrack_ipv4"
    //安装ipvs
    # yum install ipset ipvsadm -y
    //优化docker
    # cat > /etc/docker/daemon.json << EOF
    {
        "registry-mirrors": [
          "https://registry.docker-cn.com"
        ],
        "exec-opts": ["native.cgroupdriver=systemd"],
        "log-driver": "json-file",
        "log-opts": {
            "max-size": "100m",
            "max-file": "10"
        },
        "storage-driver": "overlay2",
        "storage-opts":["overlay2.override_kernel_check=true"],
        "max-concurrent-downloads": 20,
        "data-root": "/opt/docker",
        "exec-root": "/opt/docker",
        "bridge": "none",
        "debug": true,
        "default-ulimits": {
            "nofile": {
                "Name": "nofile",
                "Hard": 1024000,
                "Soft": 1024000
            },
            "nproc": {
                "Name": "nproc",
                "Hard": 1024000,
                "Soft": 1024000
            },
          "core": {
                "Name": "core",
                "Hard": -1,
                "Soft": -1    
          }

        }
    }
    EOF
    //重启docker
    # systemctl restart docker

    //验证是否使用新配置
    # docker info

PS:

* A. 代理：

&nbsp;&nbsp;&nbsp;&nbsp;注意：

&nbsp;&nbsp;&nbsp;&nbsp;这里使用的代理是http代理,并不是socket5代理,在使用代理时注意配置好转发规则。

    //docker使用代理
    # sed -i '/Type=notify/a\Environment="HTTP_PROXY=http://172.20.0.1:8000/" "HTTPS_PROXY=http://172.20.0.1:8000" "NO_PROXY=localhost,127.0.0.1"' /lib/systemd/system/docker. service
    //yum使用代理
    # echo "proxy=http://172.20.0.1:8000" >> /etc/yum.conf

* B. docker使用devicemapper存储：

&nbsp;&nbsp;&nbsp;&nbsp;docker使用devicemapper作为存储驱动时,需要保证有足够的存储空间（空闲磁盘与分区）,安装了device-mapper-persistent-data,lvm2等驱动包。

&nbsp;&nbsp;&nbsp;&nbsp;注意：

&nbsp;&nbsp;&nbsp;&nbsp;切换存储驱动会导致docker之前的镜像和内容全部删除，所以请注意备份。

- 1. 空白磁盘(sdb)分区

```
    //使用parted工具转换磁盘分区格式类型为gpt格式
    # parted /dev/sdb mklabel gpt yes
    //创建第一个分区,主分区类型(primary),大小为2048扇区到50%
    # parted /dev/sdb mkpart primary 2048s 50%
    //创建第二个分区,主分区类型(primary),大小为50%到100%
    # parted /dev/sdb mkpart primary 50%  100%
    //只想创建一个分区
    # parted /dev/sdb mkpart primary 0 -1
```    

- 2. 创建thinpool

```
    //创建pv
    # pvcreate -y /dev/sdb1
    //创建vg,名称为docker
    # vgcreate -y docker /dev/sdb2
    //根据vg创建thinpool与thinpoolmeta两个lv
    # lvcreate -y --wipesignatures y -n thinpool -l 90%VG docker
    # lvcreate -y --wipesignatures y -n thinpoolmeta -l 5%VG docker
    //用lvconvert命令把thinpool数据卷和thinpoolmeta元数据卷换为一个精简池，且此精简池使用原数据卷的名字
    # lvconvert -y --zero n -c 512K --thinpool docker/thinpool --poolmetadata docker/thinpoolmeta
    #更新/etc/lvm/profile/docker-thinpool.profile
    # cat > /etc/lvm/profile/docker-thinpool.profile << EOF
    activation {
        thin_pool_autoextend_threshold=80
        thin_pool_autoextend_percent=20
    }
    EOF
    //用lvchange命令激活LVM profile
    # lvchange --metadataprofile docker-thinpool docker/thinpool
    //验证并确保已启用对逻辑卷的监视, 如果最后一列显示not monitor，则需要添加监控：lvchange --monitor y docker/thinpool
    # lvs -o+seg_monitor   
    // 如果曾经运行过docker，则需要移动一些文件，以便docker使用新的lvm池来存储内容
    # mkdir /var/lib/docker.bk
    # mv /var/lib/docker/* /var/lib/docker.bk
```

- 3. 配置docker

```
    //修改daemon.json
    {
        "storage-driver":"devicemapper",
        "storage-opts": [
            "dm.thinpooldev=/dev/mapper/docker-thinpool",
            "dm.use_deferred_removal=true",
            "dm.use_deferred_deletion=true"
        ]
    }
    //重启docker
    # systemctl restart docker
    //配置正确后可以删除之前的备份
    # rm -rf /var/lib/docker.bk
```

*C. 关闭docker0

&nbsp;&nbsp;&nbsp;&nbsp;注意：
&nbsp;&nbsp;&nbsp;&nbsp;在生产或者网络较复杂环境docker的网卡会与主机以外的网络冲突

    //修改daemon.json
    {
       "bridge": "none",
    }
    //重启docker
    # systemctl restart docker

*D.主机路由

&nbsp;&nbsp;&nbsp;&nbsp;注意：

&nbsp;&nbsp;&nbsp;&nbsp;如果主机默认路由有异常，或者是我这种使用双网卡的主机，都要调整路由到节点互通的网卡。

&nbsp;&nbsp;&nbsp;&nbsp;本人在使用vagrant搭建集群时发现calico-node异常重启，容器日志报：

    {"log":"2020-09-29 12:58:01.235 [ERROR][8] startup/startup.go 153: failed to query kubeadm's config map error=Get \"https://10.224.0.1:443/api/v1/namespaces/kube-system/configmaps/kubeadm-config?timeout=2s\": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)\n","stream":"stdout","time":"2020-09-29T12:58:01.236258451Z"}

&nbsp;&nbsp;&nbsp;&nbsp;解决办法：

    给集群通讯地址添加路由指向。
    ip route add 10.224.0.0/16 dev eth1
    添加永久路由
    cat <<EOF >> /etc/sysconfig/network-scripts/route-eth1
    10.224.0.0/16 dev eth1
    EOF


### 2. haproxy 安装(master节点)

    //安装haproxy
    # yum install haproxy -y
    //配置haproxy
    # cat > /etc/haproxy/haproxy.cfg  << EOF
    global
    log 127.0.0.1 local0
    #最大连接数
    maxconn 65535
    #以后台形式运行haproxy
    daemon
    #haproxy启动UID
    uid 99
    #启动GID
    gid 99
    #启动1个haproxy实例,进程数
    nbproc 1
    #全局的默认配置
    defaults
        #log    global
        log     127.0.0.1       local3      #日志文件的输出定向
    
        #默认的模式:tcp|http|health
        mode   http         #所处理的类别,默认采用http模式
    
        option  httplog      #日志类别,采用http日志格式
        option  dontlognull
        option  forwardfor   #将客户端真实ip加到HTTP Header中供后端服务器读取
        option  httpclose    #每次请求完毕后主动关闭http通道,haproxy不支持keep-alive,只>能模拟这种模式的实现
        retries 3            #3次连接失败就认为服务器不可用，主要通过后面的check检查
        option  redispatch   #当serverid对应的服务器挂掉后，强制定向到其他健康服务器
        option  abortonclose #当服务器负载很高时，自动结束掉当前队列中处理比较久的链接
        maxconn 2000         #默认最大连接数
    
        timeout connect 5000  #连接超时时间
        timeout client  50000 #客户端连接超时时间
        timeout server  50000 #服务器端连接超时时间
    
        stats   enable
        stats   uri /haproxy-stats   #haproxy监控页面的访问地址
        stats   auth admin:admin123    #设置监控页面的用户和密码
        stats   hide-version         #隐藏统计页面的HAproxy版本信息

    # Haproxy统计页面
    # --------------------------------------------------------------------------------------------
    listen haproxy_stats
        bind 0.0.0.0:1080  #侦听IP:Port
        mode http
        log  127.0.0.1 local0 err #err|warning|info|debug]
        stats refresh 30s
        stats uri /haproxy-stats
        stats realm Haproxy\ Statistics
        stats auth admin:admin
        stats hide-version
        stats admin if TRUE  #手工启用/禁用后端服务器
    #kube-apiserver
    # --------------------------------------------------------------------------------------------
    frontend kube-apiserver
        #监控所有的16443端口
        bind *:16443
        #tcp模式
        mode tcp
        #启用tcp的 log
        option tcplog 
        default_backend kube-apiserver
    # kube-apiserver的backend的设置    
    # --------------------------------------------------------------------------------------------
    backend kube-apiserver
        #tcp模式
        mode tcp
        #ssl转发
        option ssl-hello-chk
        #tcp探活检查
        option tcp-check
        #负载均衡，轮询方式
        balance roundrobin
        stick-table type ip size 200k expire 30m
        stick on src
        #https_6443
        server m1 172.20.0.111:6443 check port 6443
        server m2 172.20.0.112:6443 check port 6443
        server m3 172.20.0.113:6443 check port 6443
    EOF
    //启动haproxy并设置开机启动
    #systemctl start haproxy && systemctl enable haproxy
    //访问http://${master_ip}//haproxy-stats
    //账号密码为admin admin

PS:

相关文档：

[haproxy配置查询](https://cbonte.github.io/haproxy-dconv/)



### 3. 安装keepalived


    //安装keepalived
    # yum install keepalived -y
    //配置haproxy
    # cat >  /etc/keepalived/keepalived.conf  << EOF
    global_defs {
        router_id LVS_DEVEL
    }
    vrrp_script check_apiserver {
      # 执行的检查脚本
      script "/etc/keepalived/check_apiserver.sh"
      # 执行的时间间隔
      interval 3
      # 检查失败时priority值的变化
      weight -2
      fall 10
      rise 2
    }
    # VI_1
    # --------------------------------------------------------------------------------------------
    vrrp_instance VI_1 {
        state BACKUP
        # 节点网卡，用于发VRRP包
        interface eth1
        virtual_router_id 51
        # 设置优先级，取值在1-255，值最高的将成为master
        priority 101
        #设置认证
        authentication {
            #认证类型
            auth_type PASS
            #认证密码
            auth_pass 42
        }
        #设置vip
        virtual_ipaddress {
            172.20.0.110
        }
        #使用vrrp_script脚本check_apiserver监听
        track_script {
            check_apiserver
        }
    }
    EOF
    //配置检查脚本
    # cat >  /etc/keepalived/check_apiserver.sh  << 'EOF'
    #!/bin/sh
    APISERVER_DEST_PORT=6443
    PISERVER_VIP=172.20.0.110
    errorExit() {
        echo "$(date) *** $*" &>/tmp/kp.check.log
        exit 1
    }
    curl --silent --max-time 2 --insecure https://localhost:${APISERVER_DEST_PORT}/ -o /dev/null || errorExit "Error GET https://localhost:${APISERVER_DEST_PORT}/"
    if ip addr | grep -q ${APISERVER_VIP}; then
        curl --silent --max-time 2 --insecure https://${APISERVER_VIP}:${APISERVER_DEST_PORT}/ -o /dev/null || errorExit "Error GET https://${APISERVER_VIP}:${APISERVER_DEST_PORT}/"
    fi
    EOF
    # chmod +x /etc/keepalived/check_apiserver.sh
    //启动keepalived并设置开机启动
    #  systemctl start keepalived && systemctl enable keepalived


PS：


state BACKUP必有一个节点为MASTER，防止开机启动争抢。


相关文档：

[keepalived配置查询](https://www.keepalived.org/manpage.html)


### 4. 生成证书(Node1)

#### 4.1). 安装cfssl工具

    //安装cfssl工具
    # export CFSSL_URL="https://pkg.cfssl.org/R1.2"
    # wget "${CFSSL_URL}/cfssl_linux-amd64" -O /usr/bin/cfssl
    # wget "${CFSSL_URL}/cfssljson_linux-amd64" -O /usr/bin/cfssljson
    # wget "${CFSSL_URL}/cfssl-certinfo_linux-amd64" -O /usr/bin/cfssl-certinfo
    # chmod +x /usr/bin/cfssl /usr/bin/cfssljson /usr/bin/cfssl-certinfo 
    //新建证书目录
    # mkdir -p /vagrant/ssl && cd /vagrant/ssl

#### 4.2). 修改证书配置模板，分别配置针对三种不同证书类型的profile,其中有效期43800h为5年

    # cat <<EOF > ca-config.json
    {
        "signing": {
            "default": {
                "expiry": "43800h"
            },
            "profiles": {
                "server": {
                    "expiry": "43800h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "server auth"
                    ]
                },
                "client": {
                    "expiry": "43800h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "client auth"
                    ]
                },
                "peer": {
                    "expiry": "43800h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "server auth",
                        "client auth"
                    ]
                }
            }
        }
    }
    EOF

PS:

+ ca-config.json：可以定义多个 profiles，如server,client,peer，分别定义不同的过期时间、使用场景等参数；后续在签名证书时使用某个 profile。
+ default默认策略，指定了证书的默认有效期是5年(43800h)
+ signing：表示该证书可用于签名其它证书；生成的 ca.pem 证书中 CA=TRUE；
+ server auth：表示client可以用该CA对server提供的证书进行验证；
+ client auth：表示server可以用该CA对client提供的证书进行验证；
+ expiry：也表示过期时间，如果不写以default中的为准;
+ 注意标点符号,标点符号只支持英文，最后一个字段一般是没有逗号（,）的;



#### 4.3). 创建CA证书csr请求模版

    # cat <<EOF > ca-csr.json
    {
        "CN": "Self Signed CA",
        "key": {
            "algo": "rsa",
            "size": 2048
        },
        "names": [
            {
                "C": "CN",
                "L": "ShangHai",
                "O": "allposs Personal",
                "ST": "SH",            
                "OU": "allposs",
                "CN": "allposs Personal Tester CA",
                "emailAddress": "allposs@allposs.com"
            }    ]
    }
    EOF

PS:

+ "key"：生成证书的算法
+ "CN"：Common Name，kube-apiserver 从证书中提取该字段作为请求的用户名 (User Name),注意浏览器使用该字段验证网站是否合法，一般写的是域名。非常重要。浏览器使用该字段验证网站是否合法
+ names：一些其它的属性
+ "C": Country， 国家
+ "L": Locality，地区，城市
+ "O": Organization Name，组织名称，公司名称(在k8s中常用于指定Group，进行RBAC绑定)
+ "OU"": Organization Unit Name，组织单位名称，公司部门
+ "ST": State，州，省


#### 4.4). 生成CA证书和私钥

    # cfssl gencert -initca ca-csr.json | cfssljson -bare ca -


#### 4.5). 创建server证书csr请求模版
    # cat <<EOF > server-csr.json
    {
        "CN": "server",
        "hosts": [
            "127.0.0.1","172.20.0.110","172.20.0.111","172.20.0.112","172.20.0.113","172.20.0.114","172.20.0.115","172.20.0.116","172.20.0.117","172.20.0.118","172.20.0.119"
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "ShangHai",
                "O": "allposs Personal",
                "ST": "SH",            
                "OU": "allposs",
                "CN": "allposs Personal Tester CA",
                "emailAddress": "allposs@allposs.com"
            }
        ]
    }
    EOF

#### 4.6). 生成服务端证书和私钥

    # cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=server server-csr.json | cfssljson -bare server


#### 4.7). 创建client证书csr请求模版

    # cat <<EOF > client-csr.json
    {
        "CN": "client",
        "hosts": [
            "127.0.0.1","172.20.0.110","172.20.0.111","172.20.0.112","172.20.0.113","172.20.0.114","172.20.0.115","172.20.0.116","172.20.0.117","172.20.0.118","172.20.0.119"
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "ShangHai",
                "O": "allposs Personal",
                "ST": "SH",            
                "OU": "allposs",
                "CN": "allposs Personal Tester CA",
                "emailAddress": "allposs@allposs.com"
            }
        ]
    }
    EOF

#### 4.8). 生成客户端证书和私钥

    # cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=client client-csr.json | cfssljson -bare client


#### 4.9). 创建peer证书csr请求模版

    # cat <<EOF > peer-csr.json
    {
        "CN": "peer",
        "hosts": [
            "127.0.0.1","172.20.0.110","172.20.0.111","172.20.0.112","172.20.0.113","172.20.0.114","172.20.0.115","172.20.0.116","172.20.0.117","172.20.0.118","172.20.0.119"
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "ShangHai",
                "O": "allposs Personal",
                "ST": "SH",            
                "OU": "allposs",
                "CN": "allposs Personal Tester CA",
                "emailAddress": "allposs@allposs.com"
            }
        ]
    }
    EOF

#### 4.10). 生成peer证书和私钥

    # cfssl cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=peer peer-csr.json | cfssljson -bare peer

PS:

如果CA证书过期，则可以使用下面方法重新生成CA证书

    # 使用现有的CA私钥，重新生成： 
    cfssl gencert -initca -ca-key ca-key.pem ca-csr.json | cfssljson -bare ca
    # 使用现有的CA私钥和CA证书，重新生成：
    cfssl gencert -renewca -ca-key ca-key.pem -ca ca.pem  | cfssljson -bare ca

### 5. 安装etcd(Node1-Node3)

    //下载etcd(如果是已经下载好了可以忽略)
    # cd /vagrant && wget https://github.com/etcd-io/etcd/releases/download/v3.4.14/etcd-v3.4.14-linux-amd64.tar.gz
    //移动etcd二进制文件到/user/bin目录
    # tar xf /vagrant/etcd-v3.4.14-linux-amd64.tar.gz && mv etcd-v3.4.14-linux-amd64/etcd* /usr/bin/ && rm -rf etcd-v3.4.14-linux-amd64
    //移动相应证书到etcd目录
    # mkdir /etc/etcd/ssl/ -p && cd /etc/etcd/ssl/ &&  cp /vagrant/ssl/{server.pem,server-key.pem,peer.pem,peer-key.pem,ca.pem} .

    Node1节点创建etcd配置
    # cat <<EOF >/etc/etcd/etcd.conf
    # [member]
    #etcd名称
    ETCD_NAME=Node1
    #etcd数据存放目录
    ETCD_DATA_DIR=/opt/etcd
    #etcd集群通讯监听地址
    ETCD_LISTEN_PEER_URLS=https://0.0.0.0:2380
    #etcd客户端访问监听地址
    ETCD_LISTEN_CLIENT_URLS=https://0.0.0.0:2379
    #关闭代理
    ETCD_PROXY=off
    # [cluster]
    ETCD_ADVERTISE_CLIENT_URLS=https://172.20.0.111:2379
    ETCD_INITIAL_ADVERTISE_PEER_URLS=https://172.20.0.111:2380
    ETCD_INITIAL_CLUSTER="Node1=https://172.20.0.111:2380,Node2=https://172.20.0.112:2380,Node3=https://172.20.0.113:2380"
    ETCD_INITIAL_CLUSTER_STATE=new
    ETCD_INITIAL_CLUSTER_TOKEN=etcd-k8s-cluster
    # [security]
    ETCD_CERT_FILE="/etc/etcd/ssl/peer.pem"
    ETCD_KEY_FILE="/etc/etcd/ssl/peer-key.pem"
    ETCD_CLIENT_CERT_AUTH="true"
    ETCD_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_AUTO_TLS="true"
    ETCD_PEER_CERT_FILE="/etc/etcd/ssl/peer.pem"
    ETCD_PEER_KEY_FILE="/etc/etcd/ssl/peer-key.pem"
    ETCD_PEER_CLIENT_CERT_AUTH="true"
    ETCD_PEER_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_PEER_AUTO_TLS="true"
    EOF

    //Node2 节点添加etcd配置
    # cat <<EOF >/etc/etcd/etcd.conf
    # [member]
    #etcd名称
    ETCD_NAME=Node2
    #etcd数据存放目录
    ETCD_DATA_DIR=/opt/etcd
    #etcd集群通讯监听地址
    ETCD_LISTEN_PEER_URLS=https://0.0.0.0:2380
    #etcd客户端访问监听地址
    ETCD_LISTEN_CLIENT_URLS=https://0.0.0.0:2379
    #关闭代理
    ETCD_PROXY=off
    # [cluster]
    ETCD_ADVERTISE_CLIENT_URLS=https://172.20.0.112:2379
    ETCD_INITIAL_ADVERTISE_PEER_URLS=https://172.20.0.112:2380
    ETCD_INITIAL_CLUSTER="Node1=https://172.20.0.111:2380,Node2=https://172.20.0.112:2380,Node3=https://172.20.0.113:2380"
    ETCD_INITIAL_CLUSTER_STATE=new
    ETCD_INITIAL_CLUSTER_TOKEN=etcd-k8s-cluster
    # [security]
    ETCD_CERT_FILE="/etc/etcd/ssl/peer.pem"
    ETCD_KEY_FILE="/etc/etcd/ssl/peer-key.pem"
    ETCD_CLIENT_CERT_AUTH="true"
    ETCD_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_AUTO_TLS="true"
    ETCD_PEER_CERT_FILE="/etc/etcd/ssl/peer.pem"
    ETCD_PEER_KEY_FILE="/etc/etcd/ssl/peer-key.pem"
    ETCD_PEER_CLIENT_CERT_AUTH="true"
    ETCD_PEER_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_PEER_AUTO_TLS="true"
    EOF


    //Node3 节点添加etcd配置
    # cat <<EOF >/etc/etcd/etcd.conf
    # [member]
    #etcd名称
    ETCD_NAME=Node3
    #etcd数据存放目录
    ETCD_DATA_DIR=/opt/etcd
    #etcd集群通讯监听地址
    ETCD_LISTEN_PEER_URLS=https://0.0.0.0:2380
    #etcd客户端访问监听地址
    ETCD_LISTEN_CLIENT_URLS=https://0.0.0.0:2379
    #关闭代理
    ETCD_PROXY=off
    # [cluster]
    ETCD_ADVERTISE_CLIENT_URLS=https://172.20.0.113:2379
    ETCD_INITIAL_ADVERTISE_PEER_URLS=https://172.20.0.113:2380
    ETCD_INITIAL_CLUSTER="Node1=https://172.20.0.111:2380,Node2=https://172.20.0.112:2380,Node3=https://172.20.0.113:2380"
    ETCD_INITIAL_CLUSTER_STATE=new
    ETCD_INITIAL_CLUSTER_TOKEN=etcd-k8s-cluster
    # [security]
    ETCD_CERT_FILE="/etc/etcd/ssl/peer.pem"
    ETCD_KEY_FILE="/etc/etcd/ssl/peer-key.pem"
    ETCD_CLIENT_CERT_AUTH="true"
    ETCD_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_AUTO_TLS="true"
    ETCD_PEER_CERT_FILE="/etc/etcd/ssl/peer.pem"
    ETCD_PEER_KEY_FILE="/etc/etcd/ssl/peer-key.pem"
    ETCD_PEER_CLIENT_CERT_AUTH="true"
    ETCD_PEER_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_PEER_AUTO_TLS="true"
    EOF

    //所有节点添加etcd.service
    # cat <<EOF > /lib/systemd/system/etcd.service
    [Unit]
    Description=Etcd Service
    After=network.target
    [Service]
    Environment=ETCD_DATA_DIR=/var/lib/etcd/default
    EnvironmentFile=-/etc/etcd/etcd.conf
    Type=notify
    User=etcd
    PermissionsStartOnly=true
    ExecStart=/usr/bin/etcd
    Restart=on-failure
    RestartSec=10
    LimitNOFILE=65536
    [Install]
    WantedBy=multi-user.target
    EOF

    //所有节点设置用户组与启动etcd
    # groupadd etcd && useradd -c "Etcd user" -g etcd -s /sbin/nologin -r etcd && mkdir -p /opt/etcd && chown etcd:etcd -R /opt/etcd /etc/etcd
    # systemctl enable etcd.service && systemctl start etcd.service



PS:

证书问题：

日志报错`rejected connection from "127.0.0.1:56744" (error "tls: failed to verify client's certificate: x509: certificate specifies an incompatible key usage", ServerName "")`,原因是Server证书不仅用于服务端认证(server auth)，还会被用于客户端认证(client auth)，因此server 证书的配置需要同时支持 server auth 和 client auth

[issues地址](https://github.com/etcd-io/etcd/issues/9398)


### 6. 安装kubernetes集群


    //谷歌官方源
    # cat <<EOF > /etc/yum.repos.d/kubernetes.repo
    [kubernetes]
    name=Kubernetes
    baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
    enabled=1
    gpgcheck=1
    repo_gpgcheck=1
    gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
    EOF

    //阿里源
    # cat <<EOF > /etc/yum.repos.d/kubernetes.repo 
    [kubernetes] 
    name=Kubernetes 
    baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/ 
    enabled=1 
    gpgcheck=1 
    repo_gpgcheck=1 
    gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg 
    EOF

    //安装kubelet kubeadm kubectl
    # yum -y install kubelet kubeadm kubectl

    //开机启动与启动kubelet
    # systemctl enable kubelet && sudo systemctl start kubelet

    //etcd客户端证书
    # cp /vagrant/ssl/client*.pem /etc/etcd/ssl/

    //配置初始化文件
    # cat <<EOF > /vagrant/kubeadm.yaml
    apiVersion: kubeadm.k8s.io/v1beta2
    bootstrapTokens:
    - groups:
      - system:bootstrappers:kubeadm:default-node-token
      token: 9r0vjb.39qh4n1n38wodio2
      ttl: 24h0m0s
      usages:
      - signing
      - authentication
    #初始化配置设置
    kind: InitConfiguration
    #API server部署在当前节点的监听地址和端口号
    localAPIEndpoint:
      advertiseAddress: 172.20.0.111
      bindPort: 6443
    nodeRegistration:
      criSocket: /var/run/dockershim.sock
      name: Node1
      taints:
      - effect: NoSchedule
        key: node-role.kubernetes.io/master
    ---
    apiServer:
    # 设置证书host字段，如果是多个master就把master的ip和主机名写入，还可以配置域名和VIP
    #  certSANs:
    #    - 172.20.0.110
    #    - 172.20.0.111
    #    - 172.20.0.112
    #    - 172.20.0.113
    #    - 127.0.0.1
    #    #vagrant路由问题
    #    - 10.0.2.15
    #    - kubernetes
    #    - kubernetes.default
    #    - kubernetes.default.svc
    #    - kubernetes.default.svc.cluster.local
    #    - node1
    #    - node2
    #    - node3
      extraArgs:
        authorization-mode: Node,RBAC
      timeoutForControlPlane: 4m0s
    apiVersion: kubeadm.k8s.io/v1beta2
    certificatesDir: /etc/kubernetes/pki
    clusterName: kubernetes
    controlPlaneEndpoint: "172.20.0.110:16443"
    controllerManager: {}
    dns:
      type: CoreDNS
    etcd:
      external:
        endpoints:
        - https://172.20.0.111:2379
        - https://172.20.0.112:2379
        - https://172.20.0.113:2379
        caFile: /etc/etcd/ssl/ca.pem
        certFile: /etc/etcd/ssl/client.pem
        keyFile: /etc/etcd/ssl/client-key.pem
    imageRepository: registry.aliyuncs.com/google_containers
    kind: ClusterConfiguration
    kubernetesVersion: v1.19.4
    networking:
      #dns域名
      dnsDomain: cluster.local
      #Service网段
      serviceSubnet: 10.224.0.0/16
      #pod网段
      podSubnet: "10.10.0.0/16"
    scheduler: {}
    ---
    apiVersion: kubeproxy.config.k8s.io/v1alpha1
    kind: KubeProxyConfiguration
    featureGates:
      SupportIPVSProxyMode: true
    mode: ipvs
    ipvs:
      minSyncPeriod: 5s
      syncPeriod: 5s
      # ipvs 负载策略
      scheduler: "wrr"
    EOF

    //初始化第一个节点
    # kubeadm init --config kubeadm.yaml --upload-certs


    //初始化完成后会有以下提示
    Your Kubernetes control-plane has initialized successfully!

    To start using your cluster, you need to run the following as a regular user:

      mkdir -p $HOME/.kube
      sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
      sudo chown $(id -u):$(id -g) $HOME/.kube/config

    You should now deploy a pod network to the cluster.
    Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
      https://kubernetes.io/docs/concepts/cluster-administration/addons/

    You can now join any number of the control-plane node running the following command on each as root:

      kubeadm join 172.20.0.110:16443 --token 9r0vjb.39qh4n1n38wodio2 \
        --discovery-token-ca-cert-hash sha256:477003bf2b3afc4a43e70db3c264f344450adb89f873eb6afb472669a31159c4 \
        --control-plane --certificate-key 8decfc59a798e8d1f9f6140c54fcbc58601d8f23ca39ec29a8222ec09e443c1e

    Please note that the certificate-key gives access to cluster sensitive data, keep it secret!
    As a safeguard, uploaded-certs will be deleted in two hours; If necessary, you can use
    "kubeadm init phase upload-certs --upload-certs" to reload certs afterward.

    Then you can join any number of worker nodes by running the following on each as root:

    kubeadm join 172.20.0.110:16443 --token 9r0vjb.39qh4n1n38wodio2 \
        --discovery-token-ca-cert-hash sha256:477003bf2b3afc4a43e70db3c264f344450adb89f873eb6afb472669a31159c4 

    //配置kubectl工具链接文件
    # mkdir -p $HOME/.kube
    # sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
    # sudo chown $(id -u):$(id -g) $HOME/.kube/config


    //其他MASTER节点创建证书，并加入集群
    # kubeadm join 172.20.0.110:16443 --token 9r0vjb.39qh4n1n38wodio2 \
    --discovery-token-ca-cert-hash sha256:477003bf2b3afc4a43e70db3c264f344450adb89f873eb6afb472669a31159c4 \
    --control-plane --certificate-key 8decfc59a798e8d1f9f6140c54fcbc58601d8f23ca39ec29a8222ec09e443c1e
    # mkdir -p $HOME/.kube
    # sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
    # sudo chown $(id -u):$(id -g) $HOME/.kube/config


### 7. 安装calico


    # curl https://docs.projectcalico.org/manifests/calico-etcd.yaml -o calico.yaml
    # sed -i 's@.*etcd_endpoints:.*@\ \ etcd_endpoints:\ \"https://172.20.0.111:2379,https://172.20.0.112:2379,https://172.20.0.113:2379\"@gi' calico.yaml
    # export ETCD_CERT=`cat /etc/etcd/ssl/client.pem | base64 | tr -d '\n'`
    # export ETCD_KEY=`cat /etc/etcd/ssl/client-key.pem | base64 | tr -d '\n'`
    # export ETCD_CA=`cat /etc/etcd/ssl/ca.pem | base64 | tr -d '\n'`

    # sed -i "s@.*etcd-cert:.*@\ \ etcd-cert:\ ${ETCD_CERT}@gi" calico.yaml
    # sed -i "s@.*etcd-key:.*@\ \ etcd-key:\ ${ETCD_KEY}@gi" calico.yaml
    # sed -i "s@.*etcd-ca:.*@\ \ etcd-ca:\ ${ETCD_CA}@gi" calico.yaml

    # sed -i 's@.*etcd_ca:.*@\ \ etcd_ca:\ "/calico-secrets/etcd-ca"@gi' calico.yaml
    # sed -i 's@.*etcd_cert:.*@\ \ etcd_cert:\ "/calico-secrets/etcd-cert"@gi' calico.yaml
    # sed -i 's@.*etcd_key:.*@\ \ etcd_key:\ "/calico-secrets/etcd-key"@gi' calico.yaml

    //CALICO_IPV4POOL_CIDR 设置与pod-network-cidr相同,如果kubeadm init的时候指定了，此处保持默认即可 
    # sed -i 's@192.168.0.0/16@10.85.0.0/16@gi' calico.yaml
    //calico有两种模式，第一种就是IPIP,第二种就是BGP,其实它应用最多就是BGP，将CALICO_IPV4POOL_IPIP里的这个Always改成Never，就会让calico自动启动BGP模式
    # sed -i '/- name: CALICO_IPV4POOL_IPIP/{n;s/Always/Never/;}' calico.yaml
    # kubectl create -f calico.yaml

### 8. 安装Node节点

    //谷歌官方源
    # cat <<EOF > /etc/yum.repos.d/kubernetes.repo
    [kubernetes]
    name=Kubernetes
    baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
    enabled=1
    gpgcheck=1
    repo_gpgcheck=1
    gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/ rpm-package-key.gpg
    EOF

    //阿里源
    # cat <<EOF > /etc/yum.repos.d/kubernetes.repo 
    [kubernetes] 
    name=Kubernetes 
    baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/ 
    enabled=1 
    gpgcheck=1 
    repo_gpgcheck=1 
    gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/ rpm-package-key.gpg 
    EOF

    //安装kubelet kubeadm kubectl
    # yum -y install kubelet kubeadm kubectl

    //开机启动与启动kubelet
    # systemctl enable kubelet && sudo systemctl start kubelet

    //加入集群
    # kubeadm join 172.20.0.110:16443 --token 9r0vjb.39qh4n1n38wodio2 \
    --discovery-token-ca-cert-hash sha256:477003bf2b3afc4a43e70db3c264f344450adb89f873eb6afb472669a31159c4 

    
---
## 结束

PS 

双网卡注意默认路由

    # route del default gw 0.0.0.0
    # route add -net 0.0.0.0 gw  172.20.0.1
    # route add -net 0.0.0.0 gw  10.0.2.2
    # route add -net 172.20.0.0 netmask 255.255.255.0 metric 100 dev eth1