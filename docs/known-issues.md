# Known Issues

## Mask edge precision (v0.2.5 launch library)

SAM 3 masks are slightly inside the visible bright screen area in the source images. When the compositor places a screenshot through the mask, a thin outline of the original AI-generated screen content (glare, edge highlights) remains visible around the screenshot edge.

**Impact:** Edges of mocked screenshots show a faint outline (~1-3px). Visible in detail crops, not obtrusive at normal viewing distance.

**Why it's hard to fix automatically:** SAM 3 segments by visible brightness. The actual visible screen has anti-aliased glare extending outward that SAM 3 doesn't classify as "screen of the device." Mask dilation moves the line outward but doesn't eliminate it — at some point dilation starts spilling onto the device bezel.

**Real-world precedent:** Premium mockup tools (Mockuuups, Shots.so) use hand-refined masks for exactly this reason. Automated segmentation gets ~95% of the way; the last 5% is human craft.

**Future fix (v0.3+):** Manual mask refinement workflow — open each mask in an image editor, brush-paint the edges to extend to the actual visible screen surround. ~3-5 min per scene.

**Why we shipped anyway:** The product is fully functional. Most users will care more about scene variety, ease of use, and the editor experience than 1-3px edges. Perfect is the enemy of done.
