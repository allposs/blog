---
title:          001-vscode配置参数
date:           2020-01-08T10:20:23+08:00
draft:          true
tags:           [2020-01]
topics:         [tools,vscode]
---


## 简介

&nbsp;&nbsp;&nbsp;&nbsp;我自己使用的vscode配置参数，大家有需要自己哪去
<!--more-->

## 环境

无

## 软件包

无

## 拓扑图

无


## 正文
---

    {
        // Editor
        "editor.fontSize": 13,
        "editor.minimap.enabled": true,
        "editor.detectIndentation": false,
        "editor.wordWrap": "on",
        "editor.renderWhitespace": "none",
        "editor.snippetSuggestions": "top",
        "editor.suggestSelection": "first",
        "editor.renderLineHighlight": "all",
        "editor.quickSuggestions": {
            "other": true,
            "comments": false,
            "strings": false
        },
        // Workbench
        "workbench.statusBar.visible": true,
        "workbench.activityBar.visible": true,
        "workbench.editor.highlightModifiedTabs": true,
        "workbench.sideBar.location": "right",
        "workbench.colorTheme": "Monokai++",
        "workbench.iconTheme": "material-icon-theme",
        "workbench.startupEditor": "none",
        // Window
        "window.titleBarStyle": "custom",
        // 面包屑导航
        "breadcrumbs.enabled": true,
        // Markdown
        "[markdown]": {
            "editor.wordWrap": "on",
            "editor.renderWhitespace": "all",
            "editor.quickSuggestions": {
                "others": true,
                "comments": true,
                "strings": true
            },
            "editor.acceptSuggestionOnEnter": "on"
        },
        // Markdown All in One
        "markdown.extension.toc.updateOnSave": false,
        "markdown.extension.toc.githubCompatibility": true,
        "markdown.extension.toc.levels": "2..3",
        // Markdown Preview Enhanced
        "markdown-preview-enhanced.mermaidTheme": "default",
        "markdown-preview-enhanced.previewTheme": "atom-dark.css",
        "markdown-preview-enhanced.codeBlockTheme": "monokai.css",
        // Search
        "search.showLineNumbers": true,
        // Update
        "update.enableWindowsBackgroundUpdates": false,
        // Code Runner
        "code-runner.runInTerminal": true,

        // Go
        "go.goroot": "/usr/local/Cellar/go/1.13.5/libexec",
        "go.gopath": "/Users/allposs/Development/golang",
        "go.inferGopath": false, // 使用 Go Modules 时无需 inferGopath
        "go.useLanguageServer": true,
        "go.autocompleteUnimportedPackages": true,
        "go.gotoSymbol.includeImports": false,
        "go.gotoSymbol.includeGoroot": false,
        "go.useCodeSnippetsOnFunctionSuggest": true,
        "go.useCodeSnippetsOnFunctionSuggestWithoutType": true,
        "go.lintOnSave": "file",
        "go.buildOnSave": "off",
        "go.formatTool": "goimports",
        "go.testFlags": [
            "-v"
        ],
        "go.alternateTools": {
          "go-langserver": "bingo"
        },
        "gopls": {
            "completeUnimported": true,
            "usePlaceholders": true,
            "completionDocumentation": true,
            "hoverKind": "SynopsisDocumentation" // No/Synopsis/Full, default Synopsis
        },
        "go.languageServerExperimentalFeatures": {
            "format": true,
            "autoComplete": true,
            "rename": true,
            "goToDefinition": true,
            "hover": true,
            "signatureHelp": true,
            "goToTypeDefinition": true,
            "goToImplementation": true,
            "documentSymbols": true,
            "workspaceSymbols": true,
            "findReferences": true,
            "diagnostics": false
        },
        // python

        "python.pythonPath": "/Users/allposs/.pyenv/versions/3.8.1/bin/python",

        // Terminal
        "terminal.integrated.setLocaleVariables": false,
        //终端
        //"terminal.external.osxExec": "iTerm.app",
        //终端shell
        "terminal.integrated.shell.osx": "zsh",
        //终端字体
        "terminal.integrated.fontFamily": "Hack Nerd Font",
        // 代理
        "http.proxyStrictSSL": false,
        "http.proxy": "http://127.0.0.1:8000",
        // 网易云音乐
        "NeteaseMusic.CDN.redirect": false,
        // Git
        "git.ignoreLegacyWarning": true,
        // 字体
        "editor.fontFamily": "'Cascadia Code', Consolas, 'Courier New', monospace, '苹方-简', 'Sarasa Gothic SC'",
        "editor.fontLigatures": true,
        // 1.40.0+，自定义 activeBar 颜色
        "workbench.colorCustomizations": {
            "activityBar.activeBorder": "#007AC7",
            "activityBar.activeBackground": "#294A5B",
        },
        "git.autofetch": true,
        "explorer.confirmDelete": false,
        "explorer.confirmDragAndDrop": false,
    }
---
## 结束