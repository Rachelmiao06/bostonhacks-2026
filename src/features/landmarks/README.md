# 地图地标

绿线 B 支线实景示例在 `/explore?sample=green-b`。8 个物件分配到不同站点，位置是游戏安排。地图直接复用站点按钮和实时坐标，缩远至 12.5 级以下隐藏图像，放大后显示 22 至 34 像素。

单独查看美术素材时打开 `/explore/landmarks`。点击上方的物件，在下方查看放大图并切换 Front、Side、Back。地图开发者可以直接复用这两部分。

## 在站点上放物件

`catalog.ts` 管理 8 个物件、默认视角和建议的演示站点。键对应 `GET /api/stations` 返回的 `station.id`。这些位置是可调整的演示设计。地图负责把经纬度换成当前图层的坐标，地标根据这个坐标底部居中对齐。没有配置地标的站点仍按原样显示线路和站点。

下面的例子放在地图的客户端组件中。`x` 和 `y` 是地图已经算好的像素坐标。定位元素和线路共用同一坐标系，并跟随相同的平移和缩放。

```tsx
import { useState } from "react";
import { stationLandmarks, type LandmarkId } from "@/features/landmarks/catalog";
import { StationLandmark } from "@/features/landmarks/StationLandmark";
import { LandmarkDetail } from "@/features/landmarks/LandmarkDetail";

// 在地图组件中
const [selected, setSelected] = useState<LandmarkId | null>(null);

// 在地图的 position: relative 图层中
{projectedStations.map(({ id, name, x, y }) => {
  const landmark = stationLandmarks[id];
  if (!landmark) return null;
  return (
    <div key={id} style={{ position: "absolute", left: x, top: y }}>
      <StationLandmark id={landmark} stationName={name}
        selected={selected === landmark} onSelect={() => setSelected(landmark)} />
    </div>
  );
})}

// 在地图之外的详情区
{selected && <LandmarkDetail id={selected} />}
```

地图已有站点按钮时，在按钮内部使用 `LandmarkArt` 并传 `decorative`，由原按钮接收点击。需要接任务详情时，在 `onSelect` 里同时传出站点 ID。数据接口另有任务 ID，两者各自保留。

## PixiJS 或 Canvas

从 `catalog.ts` 导入 `landmarkSrc(id, view?)` 获得同一张透明 WebP 的公开 URL。PixiJS 可把纹理加载为 sprite，设置 `sprite.anchor.set(0.5, 1)`，按地图缩放策略设定显示尺寸，再放在 `(x, y - gap)`。Canvas 加载并复用 Image 后调用 `ctx.drawImage(image, x - size / 2, y - gap - size, size, size)`。每张图都是 40 × 40，含单像素轮廓，底部约有 1 个源像素的保护边距。Canvas 动画请读取系统的 reduced-motion 设置。

## 调外观

地图容器可以覆盖以下 CSS 变量。单个 `StationLandmark` 或 `LandmarkArt` 也可以用 `size={80}` 指定像素宽度。放大组件 `LandmarkDetail` 接受同样的 `size` 参数，默认 224。系统启用减少动态效果后，React 地标自动静止。

```css
.station-map {
  --landmark-size: 28px;
  --landmark-gap: 6px;
  --landmark-lift: 2px;
  --landmark-duration: 3s;
  --landmark-shadow: 0 2px 2px rgb(0 0 0 / 24%);
}
```

默认视角和站点对应关系改 `catalog.ts`。颜色、材质或造型直接替换对应素材。三个视角分别拍摄，切换会显示对应的图像。

## 更换或增加物件

原图在仓库根目录的 `graphics/`，每件物品对应同名前缀的 `_FRONT.png`、`_SIDE.png`、`_BACK.png`。现有文件实际编码包括 JPEG 和 WebP，转换脚本按文件内容解码。可使用真正透明的 RGBA PNG 直接替换原图。

地图使用已经提交的 `public/assets/landmarks/`，运行网站只需要仓库的 Node.js 依赖。修改原图后，在安装了 Pillow 和 NumPy 的 Python 3.9+ 环境，从仓库根目录执行：

```sh
python3 scripts/build-landmarks.py
```

脚本会从浅奶油色背景或已有透明通道提取物件、裁切并对齐底边。换成复杂背景的插画时请提供透明 PNG。新增物件时将名称、默认视角和演示站点登记在 `catalog.ts`。在预览页检查浅色细节、轮廓、底部位置和键盘操作，再一起提交原图与导出的图。
