"use client";
import { useEffect, useRef, useState } from "react";
import { Color, Scene, Fog, PerspectiveCamera, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/globe.json";

declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: any; // or provide more specific type if available
  }
}

extend({ ThreeGlobe });

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
const cameraZ = 300;

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

let numbersOfRings = [0];

export function Globe({ globeConfig, data }: WorldProps) {
  const [globeData, setGlobeData] = useState<
    | {
        size: number;
        order: number;
        color: (t: number) => string;
        lat: number;
        lng: number;
      }[]
    | null
  >(null);

  const globeRef = useRef<ThreeGlobe | null>(null);

  const defaultProps = {
    pointSize: 1,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  useEffect(() => {
    if (globeRef.current) {
      _buildData();
      _buildMaterial();
      // Add geometry validation after initialization
      const validateGeometry = () => {
        if (globeRef.current) {
          globeRef.current.traverse?.((child: any) => {
            if (
              child.geometry &&
              child.geometry.attributes &&
              child.geometry.attributes.position
            ) {
              const positions = child.geometry.attributes.position.array;
              let hasNaN = false;
              for (let i = 0; i < positions.length; i++) {
                if (!isFinite(positions[i])) {
                  positions[i] = 0;
                  hasNaN = true;
                }
              }
              if (hasNaN) {
                child.geometry.attributes.position.needsUpdate = true;
                child.geometry.computeBoundingSphere();
              }
            }
          });
        }
      };

      // Run validation periodically
      const validationInterval = setInterval(validateGeometry, 100);

      return () => clearInterval(validationInterval);
    }
  }, [globeRef.current]);

  const _buildMaterial = () => {
    if (!globeRef.current) return;

    const globeMaterial = globeRef.current.globeMaterial() as unknown as {
      color: Color;
      emissive: Color;
      emissiveIntensity: number;
      shininess: number;
    };
    globeMaterial.color = new Color(
      typeof globeConfig.globeColor === "string"
        ? globeConfig.globeColor
        : "#1d072e"
    );
    globeMaterial.emissive = new Color(
      typeof globeConfig.emissive === "string"
        ? globeConfig.emissive
        : "#000000"
    );
    globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
    globeMaterial.shininess = globeConfig.shininess || 0.9;
  };

  const _buildData = () => {
    const arcs = data;
    let points = [];
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      // Skip if coordinates are invalid
      if (
        !isFinite(arc.startLat) ||
        !isFinite(arc.startLng) ||
        !isFinite(arc.endLat) ||
        !isFinite(arc.endLng)
      ) {
        continue;
      }
      const rgb = hexToRgb(arc.color) as { r: number; g: number; b: number };
      if (!rgb) continue;

      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
        lat: arc.startLat,
        lng: arc.startLng,
      });
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
        lat: arc.endLat,
        lng: arc.endLng,
      });
    }

    // remove duplicates for same lat and lng
    const filteredPoints = points.filter((v, i, a) => {
      // Only keep points with valid coordinates
      if (!isFinite(v.lat) || !isFinite(v.lng)) return false;
      return (
        a.findIndex((v2) =>
          ["lat", "lng"].every(
            (k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"]
          )
        ) === i
      );
    });

    setGlobeData(filteredPoints);
  };

  useEffect(() => {
    if (globeRef.current && globeData) {
      globeRef.current
        .hexPolygonsData(
          countries.features.filter((feature: any) => {
            // Ensure country features have valid geometry
            return (
              feature &&
              feature.geometry &&
              feature.geometry.coordinates &&
              Array.isArray(feature.geometry.coordinates)
            );
          })
        )
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(defaultProps.showAtmosphere)
        .atmosphereColor(
          typeof defaultProps.atmosphereColor === "string"
            ? defaultProps.atmosphereColor
            : "#ffffff"
        )
        .atmosphereAltitude(defaultProps.atmosphereAltitude)
        .hexPolygonColor(() => {
          return typeof defaultProps.polygonColor === "string"
            ? defaultProps.polygonColor
            : "rgba(255,255,255,0.7)";
        });
      startAnimation();
    }
  }, [globeData]);

  const startAnimation = () => {
    if (!globeRef.current || !globeData || !data) return;

    try {
      // Filter data to ensure no invalid values
      const validArcs = data.filter(
        (arc) =>
          isFinite(arc.startLat) &&
          isFinite(arc.startLng) &&
          isFinite(arc.endLat) &&
          isFinite(arc.endLng) &&
          isFinite(arc.arcAlt) &&
          arc.color
      );

      const validPoints = globeData.filter(
        (point) => isFinite(point.lat) && isFinite(point.lng) && point.color
      );

      globeRef.current
        .arcsData(validArcs)
        .arcStartLat((d) => {
          const lat = (d as { startLat: number }).startLat;
          return isFinite(lat) ? lat : 0;
        })
        .arcStartLng((d) => {
          const lng = (d as { startLng: number }).startLng;
          return isFinite(lng) ? lng : 0;
        })
        .arcEndLat((d) => {
          const lat = (d as { endLat: number }).endLat;
          return isFinite(lat) ? lat : 0;
        })
        .arcEndLng((d) => {
          const lng = (d as { endLng: number }).endLng;
          return isFinite(lng) ? lng : 0;
        })
        .arcColor((e: any) => {
          const color = (e as { color: string }).color;
          return typeof color === "string" ? color : "#ffffff";
        })
        .arcAltitude((e) => {
          const alt = (e as { arcAlt: number }).arcAlt;
          return isFinite(alt) ? alt : 0.1;
        })
        .arcStroke((e) => {
          return [0.32, 0.28, 0.3][Math.round(Math.random() * 2)];
        })
        .arcDashLength(defaultProps.arcLength)
        .arcDashInitialGap((e) => (e as { order: number }).order)
        .arcDashGap(15)
        .arcDashAnimateTime((e) => defaultProps.arcTime);

      globeRef.current
        .pointsData(validPoints)
        .pointColor((e: any) => {
          const colorFunc = (e as any).color;
          if (typeof colorFunc === "function") {
            const result = colorFunc(0);
            return typeof result === "string" ? result : "#ffffff";
          }
          return typeof colorFunc === "string" ? colorFunc : "#ffffff";
        })
        .pointsMerge(true)
        .pointAltitude(0.0)
        .pointRadius(2);

      globeRef.current
        .ringsData([])
        .ringColor((e: any) => (t: any) => {
          if (typeof e.color === "function") {
            const result = e.color(t);
            return typeof result === "string" ? result : "#ffffff";
          }
          return typeof e.color === "string" ? e.color : "#ffffff";
        })
        .ringMaxRadius(defaultProps.maxRings)
        .ringPropagationSpeed(RING_PROPAGATION_SPEED)
        .ringRepeatPeriod(
          (defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings
        );
    } catch (error) {
      console.error("Error starting globe animation:", error);
    }
  };

  useEffect(() => {
    if (!globeRef.current || !globeData) return;

    const interval = setInterval(() => {
      if (!globeRef.current || !globeData) return;
      numbersOfRings = genRandomNumbers(
        0,
        data.length,
        Math.floor((data.length * 4) / 5)
      );

      globeRef.current.ringsData(
        globeData.filter((d, i) => numbersOfRings.includes(i))
      );
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [globeRef.current, globeData]);

  // Only render if we have valid data
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <>
      <threeGlobe ref={globeRef} />
    </>
  );
}

export function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0xffaaff, 0);
  }, []);

  return null;
}

export function World(props: WorldProps) {
  const { globeConfig } = props;

  // Validate props data
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    console.warn("Invalid or empty data provided to World component");
    return <div>Loading globe...</div>;
  }

  try {
    const scene = new Scene();
    scene.fog = new Fog(0xffffff, 400, 2000);

    return (
      <Canvas
        scene={scene}
        camera={new PerspectiveCamera(50, aspect, 180, 1800)}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <WebGLRendererConfig />
        <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
        <directionalLight
          color={globeConfig.directionalLeftLight}
          position={new Vector3(-400, 100, 400)}
        />
        <directionalLight
          color={globeConfig.directionalTopLight}
          position={new Vector3(-200, 500, 200)}
        />
        <pointLight
          color={globeConfig.pointLight}
          position={new Vector3(-200, 500, 200)}
          intensity={0.8}
        />
        <Globe {...props} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minDistance={cameraZ}
          maxDistance={cameraZ}
          autoRotateSpeed={1}
          autoRotate={true}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI - Math.PI / 3}
        />
      </Canvas>
    );
  } catch (error) {
    console.error("Error rendering World component:", error);
    return <div>Error loading globe</div>;
  }
}

export function hexToRgb(hex: string) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
  const arr = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (arr.indexOf(r) === -1) arr.push(r);
  }

  return arr;
}
