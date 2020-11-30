---
title:          003-Docker优化之daemon.json文件
date:           2020-08-14T14:20:23+08:00
draft:          true
tags:           [2020-08]
topics:         [容器,Docker]
---
## 简介
    
&nbsp;&nbsp;&nbsp;&nbsp;在生产使用容器的时候,往往有各种需求,比较常见的是容器内部ulimits设置，容器文件目录设置，docker日志设置，还有dns，使用裸盘等设置的需求，而往往这些配置都只需要在daemon.json文件里配置一下。而官方说明并没有那么详细，所以这里对daemon.json文件做个详细的说明，并举例。

<!--more-->
## 环境

    * Docker version 19.03.12, build 48a66213fe
    
    * CentOS Linux release 7.8.2003 (Core)

## 软件包

无

## 拓扑图

无

## 正文
---

### 1. daemon.json文件概要

说明：

&nbsp;&nbsp;&nbsp;&nbsp;Docker Engine V1.12之后版本，用户可以自行创建 daemon.json 文件对 Docker Engine 进行配置和调整。要点如下：

* 该文件作为 Docker Engine 的配置管理文件, 里面几乎涵盖了所有 docker 命令行启动可以配置的参数。
* 不管是在哪个平台以何种方式启动, Docker 默认都会来这里读取配置。使用户可以统一管理不同系统下的 docker daemon 配置。

&nbsp;&nbsp;&nbsp;&nbsp;相关参数的使用说明，可以参阅 man dockerd 帮助信息，或者参阅官方文档。

&nbsp;&nbsp;&nbsp;&nbsp;该--config-file选项允许您以JSON格式为守护程序设置任何配置选项。此文件使用与键相同的标志名称，但允许多个条目的标志除外，它使用多个标志名称，例如，labels用于label标志。

&nbsp;&nbsp;&nbsp;&nbsp;配置文件中设置的选项不得与通过flags设置的选项冲突。如果文件和标志之间的选项重复，则docker守护程序无法启动，无论其值如何。我们这样做是为了避免静默忽略配置重新加载中引入的更改。例如，如果在配置文件中设置守护程序标签并且还通过--label标志设置守护程序标签，则守护程序无法启动。守护程序启动时将忽略文件中不存在的选项。

&nbsp;&nbsp;&nbsp;&nbsp;Linux上配置文件的默认位置是 /etc/docker/daemon.json。该--config-file标志可用于指定非默认位置。

参数说明：

    {
        "api-cors-header":"",                               #在引擎API中设置CORS标头
        "authorization-plugins":[],                         #要加载的授权插件
        "bridge":"",                                        #将容器附加到网桥
        "cgroup-parent":"",                                 #为所有容器设置父cgroup
        "cluster-store":"",                                 #分布式存储后端的URL
        "cluster-store-opts":{},                            #设置集群存储选项（默认{}）
        "cluster-advertise":"",                             #要通告的地址或接口名称
        "debug": true,                                      #启用调试模式，启用后，可以看到很多的启动信息。默认false
        "default-gateway":"",                               #容器默认网关IPv4地址
        "default-gateway-v6":"",                            #容器默认网关IPv6地址
        "default-runtime":"runc",                           #容器的默认OCI运行时（默认为" runc"）
        "default-ulimits": {},                              #容器的默认ulimit（默认{}）
        "dns": ["192.168.1.1"],                             #设定容器DNS的地址，在容器的 /etc/resolv.conf文件中可查看。
        "dns-opts": [],                                     #容器 /etc/resolv.conf 文件，其他设置
        "dns-search": [],                                   #设定容器的搜索域，当设定搜索域为 .example.com 时，在搜索一个名为 host 的 主机时，DNS不仅搜索host，还会搜索host.example.com 。 注意：如果不设置， Docker 会默认用主机上的 /etc/resolv.conf 来配置容器。
        "exec-opts": [],                                    #运行时执行选项
        "exec-root":"",                                     #执行状态文件的根目录（默认为’/var/run/docker‘）
        "fixed-cidr":"",                                    #固定IP的IPv4子网
        "fixed-cidr-v6":"",                                 #固定IP的IPv6子网
        "data-root":"/var/lib/docker",                      #Docker运行时使用的根路径，默认/var/lib/docker
        "group": "",                                        #UNIX套接字的组（默认为"docker"）
        "hosts": ["unix:///var/run/docker.sock"， "0.0.0.0:3000"], #设置Docker的hosts配置，API接口等,注意不要与systemd冲突
        "icc": false,                                       #启用容器间通信（默认为true）
        "ip":"0.0.0.0",                                     #绑定容器端口时的默认IP（默认0.0.0.0）
        "iptables": false,                                  #启用iptables规则添加（默认为true）
        "ipv6": false,                                      #启用IPv6网络
        "ip-forward": false,                                #默认true, 启用 net.ipv4.ip_forward ,进入容器后使用 sysctl -a | grepnet.ipv4.ip_forward 查看
        "ip-masq":false,                                    #启用IP伪装（默认为true）
        "labels":["nodeName=node-121"],                     #docker主机的标签，很实用的功能,例如定义：–label nodeName=host-121
        "live-restore": true,                               #在容器仍在运行时启用docker的实时还原
        "log-driver":"",                                    #容器日志的默认驱动程序（默认为" json-file"）
        "log-level":"",                                     #设置日志记录级别（"调试"，"信息"，"警告"，"错误"，"致命"）（默认为"信息"）
        "max-concurrent-downloads":3,                       #设置每个请求的最大并发下载量（默认为3）
        "max-concurrent-uploads":5,                         #设置每次推送的最大同时上传数（默认为5）
        "mtu": 0,                                           #设置容器网络MTU
        "oom-score-adjust":-500,                            #设置守护程序的oom_score_adj（默认值为-500）
        "pidfile": "",                                      #Docker守护进程的PID文件
        "raw-logs": false,                                  #全时间戳机制
        "selinux-enabled": false,                           #默认 false，启用selinux支持
        "storage-driver":"",                                #要使用的存储驱动程序
        "swarm-default-advertise-addr":"",                  #设置默认地址或群集广告地址的接口
        "tls": true,                                        #默认 false, 启动TLS认证开关
        "tlscacert": "",                                    #默认 ~/.docker/ca.pem，通过CA认证过的的certificate文件路径
        "tlscert": "",                                      #默认 ~/.docker/cert.pem ，TLS的certificate文件路径
        "tlskey": "",                                       #默认~/.docker/key.pem，TLS的key文件路径
        "tlsverify": true,                                  #默认false，使用TLS并做后台进程与客户端通讯的验证
        "userland-proxy":false,                             #使用userland代理进行环回流量（默认为true）
        "userns-remap":"",                                  #用户名称空间的用户/组设置
        "bip":"192.168.88.0/22",                            #指定网桥IP
        "registry-mirrors": ["https://192.498.89.232:89"],  #设置镜像加速
        "insecure-registries": ["120.123.122.123:12312"],   #设置私有仓库地址可以设为http
        "storage-opts": [
            "overlay2.override_kernel_check=true",
            "overlay2.size=15G"
        ],                                                  #存储驱动程序选项
        "log-opts": {
            "max-file": "3",
            "max-size": "10m",
        },                                                  #容器默认日志驱动程序选项
        "iptables": false                                   #启用iptables规则添加（默认为true）
    }

### 2. 配置参数详解

说明:

&nbsp;&nbsp;&nbsp;&nbsp;这里配置参数详解只会说明我这边在生产上常遇到的，或者是生产需要优化的参数，当然不一定适合其他人。

#### 2.1 容器内ulimit配置参数

说明:

&nbsp;&nbsp;&nbsp;&nbsp;容器的默认ulimit（默认{}）

范例:

    {
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

#### 2.2 Docker日志配置

说明:

&nbsp;&nbsp;&nbsp;&nbsp;Log driver是Docker用来接收来自容器内部stdout/stderr的日志的模块，Docker默认的log driver是JSON File logging driver。这里只讲json-file的配置，其他的请查阅相关文档:[log-driver官网](https://docs.docker.com/config/containers/logging/)。

&nbsp;&nbsp;&nbsp;&nbsp;json-file会将容器日志存储在docker host machine的<data-root 参数>/containers/<container id>/<container id>-json.log（需要root权限才能够读），既然日志是存在磁盘上的，那么就要磁盘消耗的问题。下面介绍两个关键参数：

* max-size，单个日志文件最大尺寸，当日志文件超过此尺寸时会滚动，即不再往这个文件里写，而是写到一个新的文件里。默认值是-1，代表无限。
* max-files，最多保留多少个日志文件。默认值是1。

范例:

    {
        "debug": true,
        "log-driver": "json-file",
        "log-opts": {
            "max-size": "100m",
            "max-file": "10"
        },
    }


### 2.3 Docker使用存储配置

说明:

&nbsp;&nbsp;&nbsp;&nbsp;Docker推荐使用overlay2作为Storage driver。你可以通过docker info | grep Storage来确认一下当前使用的是什么。具体请查阅相关文档:[storage-driver官网文档](https://docs.docker.com/storage/storagedriver/)。

范例:

overlay2:

    {
      "storage-driver": "overlay2"
    }

devicemapper(裸设备):

    {
        "storage-driver": "devicemapper",
        "storage-opts": [
            "dm.thinpooldev=/dev/mapper/docker-thinpool",
            "dm.use_deferred_removal=true",
            "dm.use_deferred_deletion=true"
        ]
    }

#### 2.4 bridge网络

说明：

&nbsp;&nbsp;&nbsp;&nbsp;查看docker 网络信息相关命令：

    # docker network list
    NETWORK ID          NAME                DRIVER              SCOPE
    88b394d412fc        bridge              bridge              local
    aef19352ffc2        host                host                local
    2c8673fde5b1        none                null                local

    # docker network inspect -f '{{json .Options}}' bridge
    {"com.docker.network.bridge.default_bridge":"true","com.docker.network.bridge.enable_icc":"true","com.docker.network.bridge.enable_ip_masquerade":"true","com.docker.network.bridge.host_binding_ipv4":"0.0.0.0","com.docker.network.bridge.name":"docker0","com.docker.network.driver.mtu":"1500"}

    # docker network inspect -f '{{json .IPAM}}' bridge
    {"Driver":"default","Options":null,"Config":[{"Subnet":"172.17.0.0/16"}]}


&nbsp;&nbsp;&nbsp;&nbsp;mtu 设置是为了解决某些云主机网卡MTU不为1500与docker0 设置的MTU不一致而导致的网络问题,dockr host machine 网卡与docker0 网卡MTU一致,则不需要配置,具体值可以与dockr host machine 网卡的值一致。

&nbsp;&nbsp;&nbsp;&nbsp;bridge 设置docker网络连接方式,默认为bridge,在与某些网络插件配合(calico)使用的时候可以选择none,当然设置里none,bip与fixed-cidr等参数就无法使用,启动时会提示互斥并无法启动成功。

&nbsp;&nbsp;&nbsp;&nbsp;详细请看官网文档:[bridge官网文档](https://docs.docker.com/network/)

范例：

    {
      "mtu": 1450
      "bridge": "none",
      "bip": "192.168.1.5/24",
      "fixed-cidr": "192.168.1.5/25",
      "dns": ["10.20.1.2","10.20.1.3"]
    }



#### 2.5 liveRestore

说明:
    
&nbsp;&nbsp;&nbsp;&nbsp;开启live restore特性能够在Docker daemon停止的时候依旧让容器保持运行。

&nbsp;&nbsp;&nbsp;&nbsp;注意：在Daemon停机期间，容器的日志被暂存在一个缓冲区中，如果缓冲区满了（默认大小64K），则容器就会被阻塞住。本特性不支持，对Docker daemon做major或minor升级所引起的daemon停机。

范例:

    {
      "live-restore": true
    }


---
## 结束

ps: 
    [Docker官方文档](https://docs.docker.com/)