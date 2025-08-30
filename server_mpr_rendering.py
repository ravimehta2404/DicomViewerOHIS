
# FastAPI + SimpleITK sketch
import io, numpy as np, SimpleITK as sitk
from fastapi import FastAPI, HTTPException
from PIL import Image

app = FastAPI()
cache = {}  # VERY simple LRU in real code

def load_volume_from_orthanc(study, series):
    # fetch instances via QIDO, frames via WADO-RS from Orthanc (admin auth)
    # stack to 3D numpy, capture spacing/orientation (ImagePosition/Orientation, PixelSpacing, SliceThickness)
    ...

def reslice(volume, spacing, plane, loc, thickness_mm=0, mode='avg'):
    # reformat with ResampleImageFilter to requested plane at normalized location
    # if thickness_mm>0, combine neighboring slices (MIP/avg)
    ...

@app.get("/mpr/slice")
def mpr_slice(study: str, series: str, plane: str, loc: float,
              size: int = 512, ww: float|None = None, wc: float|None = None,
              thickness: float = 0.0, mode: str = "avg"):
    key = (study, series)
    if key not in cache:
        cache[key] = load_volume_from_orthanc(study, series)
    vol, spacing = cache[key]
    img = reslice(vol, spacing, plane, loc, thickness, mode)     # numpy 2D
    if ww and wc:
        low, high = wc - ww/2, wc + ww/2
        img = np.clip((img - low) / (high - low) * 255, 0, 255).astype(np.uint8)
    img = Image.fromarray(img).resize((size, size))
    buf = io.BytesIO(); img.save(buf, format="PNG")
    return Response(buf.getvalue(), media_type="image/png")
