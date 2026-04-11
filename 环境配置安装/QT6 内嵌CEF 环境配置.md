---
title: QT6 内嵌CEF 环境配置
date: 2025-03-02 22:48:55
tags:
- QT
- CEF
- 环境配置
categories:
 - 环境配置安装
---
最近开发一个项目，需要在Qt中使用CEF，记录一下相关的环境配置（Windows下）。

需要的软件：Qt6、cmake、vs2022
<!--more-->
# CEF相关内容
## CEF下载
下载地址：[https://cef-builds.spotifycdn.com/index.html](https://cef-builds.spotifycdn.com/index.html)

我这里下载是windows64位的标准版本

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741437197704-a775d440-a95c-47c4-8d81-0828c99ee59c.png)

## CEF编译
![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741437420406-1dc82bd0-52d1-47f9-8abb-60fa107b1033.png)

在当前目录允许以下命令

```powershell
mkdir build
cd build
cmake ..
```

如果能够正常编译的话，我们能在build目录下找到.sln文件，然后直接双击打开

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741438164334-ca798880-818b-4bd9-96ed-9c2aee69e0bb.png)

## CEF项目结构
![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741438355163-1a4db978-af8f-48be-a4ba-a8b927639974.png)

cef_gtest：包含ceftests目标使用的Google C++测试框架。

ceftests：包含执行CEF API的单元测试。

cefclient：一个包含CEF各种API演示的浏览器程序Demo。

cefsimple：一个创建CEF浏览器程序所需最少功能的Demo。

libcef_dll_wrapper：对cef库的C++代码封装库。

我们设置cefclient为启动项，运行后可以正常跳一个窗口，就说明我们cef环境没有问题

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741438499181-f66ccd78-46d1-423f-bbc2-791202acf426.png)

## libcef_dll_wrapper编译
在Qt中我们需要使用cef相关的库，所以需要编译libcef_dll_wrapper。我们将libcef_dll_wrapper设置为启动项，并且需要将运行库改为“多线程调试 DLL (/MDd)”（如果是 release 版，则改为“多线程 DLL (/MD)”）

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741439851642-08aa063a-b520-4fb1-a853-02e9a89763cc.png)

运行之后，我们可以在build目录的libcef_dll_wrapper中找到对于的lib库和pdb符号

# Qt相关内容
创建一个Qt6项目并且成功运行，Qt现在都是首选cmake作为构建工具，方便很多。

项目结构如下：

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741440820239-7857f7db-f6d3-4f1a-a287-30793eeb7828.png)

## 复制文件
cef目录是我们自己进行创建的。我们还需要需要在cef目录里面创建一个bin目录存储二进制文件

1. 我们先需要复制cef目录下（前面编译的cef目录）的Resources和Include到demo下的cef目录里面

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741441686989-1c5a21b3-5fe6-4945-8aad-2ab02ee6addf.png)

2. 复制debug、release目录到demo下的cef下bin目录里面

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741442043990-34a4d29d-680c-4b9f-907f-906cd311d6b9.png)

3. 将前面编译的libcef_dll_wrapper.lib文件，也拷贝到对应的bin目录中Debug或者Release目录下

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741442297427-838fe24e-c664-49cd-9c5b-b2cac6f62f44.png)

最终结构目录如下，src中simple_app、simple_handler等文件是把cefsimple下面的文件复制进来了

```bash
Demo
├─ cef
│  ├─ bin
│  │  ├─ Debug
│  │  │  │  libcef.dll
│  │  │  │  libcef.lib
│  │  │  │  libcef_dll_wrapper.lib
│  │  │  │  ... (其他Debug模式下的库文件)
│  │  │  └─ swiftshader
│  │  │          ... (swiftshader相关文件)
│  │  └─ Release
│  │      │  libcef.dll
│  │      │  libcef.lib
│  │      │  libcef_dll_wrapper.lib
│  │      │  ... (其他Release模式下的库文件)
│  │      └─ swiftshader
│  │              ... (swiftshader相关文件)
│  ├─ include
│  │      各种.h头文件
│  │      ...
│  └─ Resources
│      │  cef.pak
│      │  .. (其他资源文件)
│      └─ locales
│              ... (不同语言包文件)
│              zh-CN.pak
│              zh-TW.pak
└─ src
     │  main.cpp
     │  mainwindow.cpp	
     │  mainwindow.h
     │  mainwindow.ui
     │  simple_app.cc
     │  simple_app.h
     │  simple_handler.cc
     │  simple_handler.h
     │  simple_handler_win.cc
```

## main文件内容
```cpp
#include "mainwindow.h"

#include <QApplication>
#include "simple_app.h"

/**
 * 初始化QT以及CEF相关
 */
int init_qt_cef(int& argc, char** argv)
{
    const HINSTANCE h_instance = static_cast<HINSTANCE>(GetModuleHandle(nullptr));

    const CefMainArgs main_args(h_instance);
    const CefRefPtr<SimpleApp> app(new SimpleApp); //CefApp实现，用于处理进程相关的回调。

    const int exit_code = CefExecuteProcess(main_args, app.get(), nullptr);
    if (exit_code >= 0)
    {
        return exit_code;
    }

    // 设置配置
    CefSettings settings;
    settings.multi_threaded_message_loop = true; //多线程消息循环
    settings.log_severity = LOGSEVERITY_DISABLE; //日志
    settings.no_sandbox = true; //沙盒

    CefInitialize(main_args, settings, app, nullptr);

    return -1;
}


int main(int argc, char *argv[])
{
    // 将init_qt_cef提取到QApplication初始化之前
    // 对于CEF多进程架构模型
    // 因为【渲染进程】启动后，init_qt_cef中执行的CefExecuteProcess会阻塞住，
    // 如果在此之前启动了QT的事件循环，那么会导致QT出现异常
    // 所以，我们将init_qt_cef提前到QApplication初始化之前，
    // 保证无论是浏览器进程还是渲染进程启动，都会进入init_qt_cef，但渲染进程会在里面阻塞，
    // 不会进入后续的QT应用初始化
    const int result = init_qt_cef(argc, argv);
    if (result >= 0)
    {
        return result;
    }

    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);  // 解决高DPI下，界面比例问题
    QApplication a(argc, argv);

    MainWindow w;
    w.show();
    a.exec();

    CefShutdown(); // 关闭CEF，释放资源

    return 0;
}

```

## mainwindow.cpp内容
我们在mainwindow构造函数里面写一些内容

```cpp
#include "mainwindow.h"
#include "./ui_mainwindow.h"

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    // 以下是将 SimpleHandler 与窗体进行关联的代码
    CefWindowInfo cef_wnd_info;
    std::string str_url = "www.baidu.com";
    QRect rect = this->geometry();
    CefRect win_rect(
        rect.left(),
        rect.top(),
        rect.left() + rect.width() * devicePixelRatio(),
        rect.top() + rect.height() * devicePixelRatio());

    cef_wnd_info.SetAsChild((HWND)this->winId(), win_rect); //将cef界面嵌入qt界面中
    CefBrowserSettings cef_browser_settings;
    simple_handler_ = CefRefPtr<SimpleHandler>(SimpleHandler::GetInstance());
    CefBrowserHost::CreateBrowser(cef_wnd_info,
        simple_handler_,
        str_url,
        cef_browser_settings,
        nullptr,
        CefRequestContext::GetGlobalContext());
}

MainWindow::~MainWindow()
{
    delete ui;
}

```

## cmake文件内容
```cmake
cmake_minimum_required(VERSION 3.16)

project(TinyAnt VERSION 0.1 LANGUAGES CXX)

set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_BUILD_TYPE "Debug") # 或者 "Release"

find_package(QT NAMES Qt6 Qt5 REQUIRED COMPONENTS Widgets)
find_package(Qt${QT_VERSION_MAJOR} REQUIRED COMPONENTS Widgets)

# 【CEF】CEF相关头文件的引入
INCLUDE_DIRECTORIES("${CMAKE_SOURCE_DIR}/cef")
INCLUDE_DIRECTORIES("${CMAKE_SOURCE_DIR}/cef/include")

set(PROJECT_SOURCES
        src/main.cpp
        src/mainwindow.cpp
        src/mainwindow.h
        src/mainwindow.ui
        src/simple_handler.h
        src/simple_handler.cc
        src/simple_handler_win.cc
        src/simple_app.h
        src/simple_app.cc
)

# CEF库位置
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(CEF_DLL_DIR "${CMAKE_SOURCE_DIR}/cef/bin/Debug")
elseif(CMAKE_BUILD_TYPE STREQUAL "Release")
    set(CEF_DLL_DIR "${CMAKE_SOURCE_DIR}/cef/bin/Release")
endif()

if(${QT_VERSION_MAJOR} GREATER_EQUAL 6)
    qt_add_executable(TinyAnt
        MANUAL_FINALIZATION
        ${PROJECT_SOURCES}
    )
# Define target properties for Android with Qt 6 as:
#    set_property(TARGET TinyAnt APPEND PROPERTY QT_ANDROID_PACKAGE_SOURCE_DIR
#                 ${CMAKE_CURRENT_SOURCE_DIR}/android)
# For more information, see https://doc.qt.io/qt-6/qt-add-executable.html#target-creation
else()
    if(ANDROID)
        add_library(TinyAnt SHARED
            ${PROJECT_SOURCES}
        )
# Define properties for Android with Qt 5 after find_package() calls as:
#    set(ANDROID_PACKAGE_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/android")
    else()
        add_executable(TinyAnt
            ${PROJECT_SOURCES}
        )
    endif()
endif()

target_compile_definitions(TinyAnt PRIVATE NOMINMAX)
target_compile_definitions(TinyAnt PRIVATE _ITERATOR_DEBUG_LEVEL=0)

target_link_libraries(TinyAnt PRIVATE Qt${QT_VERSION_MAJOR}::Widgets)
target_link_libraries(TinyAnt PRIVATE "${CMAKE_SOURCE_DIR}/cef/bin/Debug/libcef.lib" "${CMAKE_SOURCE_DIR}/cef/bin/Debug/libcef_dll_wrapper.lib")

# Qt for iOS sets MACOSX_BUNDLE_GUI_IDENTIFIER automatically since Qt 6.1.
# If you are developing for iOS or macOS you should consider setting an
# explicit, fixed bundle identifier manually though.
if(${QT_VERSION} VERSION_LESS 6.1.0)
  set(BUNDLE_ID_OPTION MACOSX_BUNDLE_GUI_IDENTIFIER com.example.TinyAnt)
endif()
set_target_properties(TinyAnt PROPERTIES
    ${BUNDLE_ID_OPTION}
    MACOSX_BUNDLE_BUNDLE_VERSION ${PROJECT_VERSION}
    MACOSX_BUNDLE_SHORT_VERSION_STRING ${PROJECT_VERSION_MAJOR}.${PROJECT_VERSION_MINOR}
    MACOSX_BUNDLE TRUE
    WIN32_EXECUTABLE TRUE
)

include(GNUInstallDirs)
install(TARGETS TinyAnt
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

if(QT_VERSION_MAJOR EQUAL 6)
    qt_finalize_executable(TinyAnt)
endif()

add_custom_command(TARGET TinyAnt POST_BUILD
                   COMMAND ${CMAKE_COMMAND} -E copy_directory
                   ${CEF_DLL_DIR}
                   $<TARGET_FILE_DIR:TinyAnt>)
```

最终运行的结果

![](https://cdn.jsdelivr.net/gh/bugcat9/blog-image-bed@main/环境配置/1741443796722-92702278-6ec6-4a05-a218-f88f4da91b48.png)

# 遇到的问题
1. std::max 编译错误，cmake里面增加了宏`target_compile_definitions(TinyAnt PRIVATE NOMINMAX)`
2. libcef_dll_wrapper.lib(libcef_dll_wrapper.obj) : error LNK2038: 检测到“_ITERATOR_DEBUG_LEVEL”的不匹配项: 值“0”不匹配值“2”(mocs_compilation.cpp.obj 中)，cmake里面增加了宏`target_compile_definitions(TinyAnt PRIVATE _ITERATOR_DEBUG_LEVEL=0)`
3. 找不到 libcef.dll（典中典之找不到动态库）。这个是因为编译出的可执行文件在build/debug目录下，他找不到cef下面的bin/debug目录（release同类），所以需要cmake将cef下面的bin/debug目录里面的内容复制到build/debug下。可以加入以下cmake命令

```cmake
# 假设你在 CMakeLists.txt 文件中定义了你的目标 TinyAnt
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(CEF_DLL_DIR "${CMAKE_SOURCE_DIR}/cef/bin/Debug")
elseif(CMAKE_BUILD_TYPE STREQUAL "Release")
    set(CEF_DLL_DIR "${CMAKE_SOURCE_DIR}/cef/bin/Release")
endif()

add_custom_command(TARGET TinyAnt POST_BUILD
                   COMMAND ${CMAKE_COMMAND} -E copy_directory
                   ${CEF_DLL_DIR}
                   $<TARGET_FILE_DIR:TinyAnt>)
```



参考：

+ [https://juejin.cn/post/6981077794507718692#heading-8](https://juejin.cn/post/6981077794507718692#heading-8)
+ [https://blog.csdn.net/weixin_45551020/article/details/136383436](https://blog.csdn.net/weixin_45551020/article/details/136383436)
+ [https://www.cnblogs.com/w4ngzhen/p/16686232.html](https://www.cnblogs.com/w4ngzhen/p/16686232.html)

