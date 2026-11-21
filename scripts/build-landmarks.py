"""Prepare transparent, bottom-aligned map sprites from the team's three-view artwork."""
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
VIEWS = ("front", "side", "back")
SIZE = 40
PAD = 2


def cutout(path):
    with Image.open(path) as image:
        if "A" in image.getbands() and image.getchannel("A").getextrema()[0] < 255:
            return image.convert("RGBA")
        rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    edges = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]))
    cream = np.median(edges, axis=0)
    distance = np.max(np.abs(rgb - cream), axis=2)
    # Estimate the cream backdrop's noise from its border, including JPEG artifacts.
    noise = np.percentile(np.max(np.abs(edges - cream), axis=1), 99.9) + 2
    silhouette = Image.fromarray(np.uint8(distance > noise) * 255)
    silhouette = silhouette.filter(ImageFilter.MedianFilter(3))
    alpha = np.asarray(silhouette.filter(ImageFilter.GaussianBlur(0.65))) / 255
    # Remove cream from the soft edge so the outline also works on a dark map.
    coverage = np.maximum(alpha[:, :, None], 1 / 255)
    color = np.clip((rgb - (1 - coverage) * cream) / coverage, 0, 255)
    result = Image.fromarray(color.astype("uint8"))
    result.putalpha(Image.fromarray(np.uint8(alpha * 255)))
    return result


def build(source, destination):
    destination.mkdir(parents=True, exist_ok=True)
    fronts = sorted(source.glob("*_FRONT.png"))
    if not fronts:
        raise ValueError(f"No artwork in {source}")
    for front in fronts:
        name = front.stem.removesuffix("_FRONT")
        slug = name.lower().replace("_", "-")
        views = {}
        for view in VIEWS:
            image = cutout(source / f"{name}_{view.upper()}.png")
            bounds = image.getchannel("A").getbbox()
            if not bounds:
                raise ValueError(f"Empty view: {name} {view}")
            views[view] = image.crop(bounds)
        for view, image in views.items():
            image.thumbnail((SIZE - 2 * PAD, SIZE - 2 * PAD), Image.Resampling.LANCZOS)
            sprite = Image.new("RGBA", (SIZE, SIZE))
            sprite.paste(image, ((SIZE - image.width) // 2, SIZE - PAD - image.height))
            # A shared grid, solid silhouette and stepped tones stay legible at station size.
            alpha = sprite.getchannel("A").point(lambda a: 255 if a >= 112 else 0)
            colors = sprite.convert("RGB").quantize(colors=14, dither=Image.Dither.NONE).convert("RGBA")
            colors.putalpha(alpha)
            outline = Image.new("RGBA", sprite.size, (68, 63, 63))
            outline.putalpha(alpha.filter(ImageFilter.MaxFilter(3)))
            outline.alpha_composite(colors)
            outline.save(destination / f"{slug}-{view}.webp", lossless=True)


if __name__ == "__main__":
    if len(sys.argv) == 3:
        build(Path(sys.argv[1]), Path(sys.argv[2]))
    else:
        build(ROOT / "graphics", ROOT / "public/assets/landmarks")
