---
title: python使用opencv提取光流
date: 2022-07-22 12:34:51
tags:
- python
categories:
- 其他
---

# python使用opencv提取光流

光流flow特征中包含了一个视频当中运动相关的信息，在视频动作定位当中光流特征使用的比较多，所以记录一下提取光流特征的方法。

使用的方法是TVL1方法，最终提取的光流图片还可以配合I3D模型进行特征的提取。光流的计算先需要将视频一帧一帧提取出来，然后再通过连续两帧之间的差异进行计算。

## 提取帧

提取视频的帧的算法如下：

其中`video_list.txt`中写的是视频的名字，也就是告诉程序需要将那些视频提取帧:

![image-20220726212052926](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220726212052926.png)

`videos`中存放视频，与`video_list.txt`中写的视频名字对应

![image-20220726212224852](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220726212224852.png)

```python
import cv2
import numpy as np
import os
import multiprocessing

video_root = 'video_list.txt'
root = 'videos'
out_root = 'frames'
suffix = '.jpg'


def save_image(root, vid_name, num, image):
    file_name = os.path.join(root, vid_name, str(num) + suffix)
    # print(file_name)
    cv2.imwrite(file_name, image)


def process(vid_path, preffix):
    videoCapture = cv2.VideoCapture(vid_path)

    i = 0
    while True:
        success, frame = videoCapture.read()
        if success:
            i = i + 1
            save_image(out_root, preffix, i, frame)
            # print('save image vid name: ', file_name, '; frame num: ', i)
        else:
            break


def main(root):
    if not os.path.exists(out_root):
        os.mkdir(out_root)
    # path_list = os.listdir(root)
    path_list = []
    #### 读取txt中视频信息 ####
    with open(video_root, 'r') as f:
        for id, line in enumerate(f):
            video_name = line.strip().split()
            path_list.append(video_name[0])

    pool = multiprocessing.Pool(processes=4)
    for file_name in path_list:
        path = os.path.join(root, file_name)
        preffix = file_name.split('.')[0]
        dir_name = os.path.join(out_root, preffix)
        if not os.path.exists(dir_name):
            os.mkdir(dir_name)

        pool.apply_async(process, args=(path, preffix))
        # process(path,preffix)

    pool.close()
    pool.join()


if __name__ == '__main__':
    main(root)
    print("finish!!!!!!!!!!!!!!!!!!")

```

运行完这个程序就能将需要提取的视频帧放在`frames`对应的目录下。

![image-20220726212537411](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220726212537411.png)

## 提取flow光流

提取光流使用了opencv模块，主要通过上面提取的视频帧进行计算，光流计算使用cpu资源比较多，所以会计算很长时间。

光流提取的代码如下：

```python
import cv2
import os
import numpy as np
import glob
import multiprocessing

###### 使用frames帧进行 flow光流计算
video_root = 'video_list.txt'
root = 'frames'
out_root = 'flow'


def cal_for_frames(video_path):
    # print(video_path)
    frames = glob.glob(os.path.join(video_path, '*.jpg'))
    frames.sort()

    flow = []
    prev = cv2.imread(frames[0])
    prev = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)
    for i, frame_curr in enumerate(frames[1:]):
        curr = cv2.imread(frame_curr)
        curr = cv2.cvtColor(curr, cv2.COLOR_BGR2GRAY)
        tmp_flow = compute_TVL1(prev, curr)
        flow.append(tmp_flow)
        prev = curr

    return flow


def compute_TVL1(prev, curr, bound=15):
    TVL1 = cv2.optflow.DualTVL1OpticalFlow_create()
    flow = TVL1.calc(prev, curr, None)

    assert flow.dtype == np.float32

    flow = (flow + bound) * (255.0 / (2 * bound))
    flow = np.round(flow).astype(int)
    flow[flow >= 255] = 255
    flow[flow <= 0] = 0

    return flow


def save_flow(video_flows, flow_path):
    if not os.path.exists(flow_path):
        os.mkdir(os.path.join(flow_path))
    for i, flow in enumerate(video_flows):
        cv2.imwrite(os.path.join(flow_path, str(i) + '_x.jpg'), flow[:, :, 0])
        cv2.imwrite(os.path.join(flow_path, str(i) + '_y.jpg'), flow[:, :, 1])


def process(video_path, flow_path):
    flow = cal_for_frames(video_path)
    save_flow(flow, flow_path)


def extract_flow(root, out_root):
    if not os.path.exists(out_root):
        os.mkdir(out_root)
    # dir_list = os.listdir(root)
    dir_list = []
    ### 读取txt中视频信息
    with open(video_root, 'r') as f:
        for id, line in enumerate(f):
            video_name = line.strip().split()
            preffix = video_name[0].split('.')[0]
            dir_list.append(preffix)

    pool = multiprocessing.Pool(processes=4)
    for dir_name in dir_list:
        video_path = os.path.join(root, dir_name)
        flow_path = os.path.join(out_root, dir_name)

        # flow = cal_for_frames(video_path)
        # save_flow(flow,flow_path)
        # print('save flow data: ',flow_path)
        # process(video_path,flow_path)
        pool.apply_async(process, args=(video_path, flow_path))

    pool.close()
    pool.join()


if __name__ == '__main__':
    extract_flow(root, out_root)
    print("finish!!!!!!!!!!!!!!!!!!")

```

## 结果

最终flow光流图和提取的帧之间如下图所示，可以看到一些梳头发的动作变化。

![image-20220726213330086](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/others/image-20220726213330086.png)

## 总结

记录一下光流特征提取的算法，方便自己之后进行使用。

代码仓库：[https://github.com/zhou-ning/pytorch-i3d](https://github.com/zhou-ning/pytorch-i3d)