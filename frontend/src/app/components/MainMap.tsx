"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { Product } from "../interface";
import L from "leaflet";
import Supercluster from "supercluster";
import { toast } from "react-toastify";

const LeafleatMap = ({
  cities,
  updatePoint,
}: {
  cities: Product[];
  updatePoint: (
    productId: number,
    latitude: number,
    longitude: number
  ) => Promise<any>;
}) => {
  const [clusters, setClusters] = useState<any[]>([]);
  const mapRef = useRef<any>(null);

  const superclusterRef = useRef(
    new Supercluster({
      radius: 40, 
      maxZoom: 20, 
    })
  );

  const updateClusters = (map: { getBounds: () => any; getZoom: () => any }) => {
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    const bbox: any = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    const clusters: any = superclusterRef.current.getClusters(bbox, zoom);

    setClusters(clusters);

    return;
  };

  useEffect(() => {
    const geoJSONPlaces = cities.map((place) => {
      const geoJSONPlace: any = {
        type: "Feature",
        properties: {
          productId: place.productId,
          product_name: place.productName,
          order_id: place.orderId,
          latitude: place.latitude,
          longitude: place.longitude,
        },
        geometry: {
          type: "Point",
          coordinates: [place.longitude, place.latitude],
        },
      };

      return geoJSONPlace;
    });

    superclusterRef.current.load(geoJSONPlaces); 

    if (!mapRef.current) {
      setTimeout(() => {
        const mapInstance = mapRef.current;
        updateClusters(mapInstance);
      }, 100);
    }

    if (mapRef.current) {
      const mapInstance = mapRef.current;
      updateClusters(mapInstance);
    }
  }, [cities]);

  const MapEvents = () => {
    const map = useMap();

    map.on("moveend", () => updateClusters(map));

    return null;
  };

  const onHandleDragMarkerOver = async (e: any, productId: number) => {
    const _lat = e.target._latlng.lat;
    const _lng = e.target._latlng.lng;

    try {
      const promise_update = await updatePoint(productId, _lat, _lng);

      if (promise_update.status !== 200) {
        const errorMsg = promise_update?.message || "Ocorreu um erro desconhecido";
        toast.error(`Erro ao guardar dados: ${errorMsg}`);
        console.error("Erro do updatePoint:", promise_update);
        return;
      }

      const idx = clusters.findIndex(
        (cluster: { properties: { id: number } }) =>
          cluster.properties.id === productId);
      if (idx > -1) {
        const newClusters: any[] = [...clusters];

        newClusters[idx].properties = {
          ...newClusters[idx].properties,
          latitude: _lat,
          longitude: _lng,
        };

        newClusters[idx].geometry = {
          ...newClusters[idx].geometry,
          coordinates: [_lng, _lat],
        };

        setClusters(newClusters);
      }

      toast.success("Dados guardados com sucesso!");
    } catch (error) {
      toast.error("Erro ao guardar dados.");
      console.error("API erro:", error);
    }
  };

  return (
    <MapContainer
      center={[0, 0]}
      zoom={3}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      className="relative"
      ref={mapRef}
    >
      <LayersControl position="topright">
        {/* Base Layers */}
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="CartoDB Positron">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.carto.com/">CARTO</a>'
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Dark Map">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.carto.com/">CARTO</a>'
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay checked name="Cities">
          <LayerGroup>
            {clusters.map((cluster: any) => {
              const [longitude, latitude] = cluster.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount } =
                cluster.properties;

              if (isCluster) {
                return (
                  <Marker
                    key={`cluster-${cluster.id}`}
                    position={[latitude, longitude]}
                    icon={L.divIcon({
                      html: `<div style="background-color:rgba(0, 123, 255, 0.8); color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                        ${pointCount}
                      </div>`,
                      className: "cluster-marker",
                      iconSize: [30, 30],
                    })}
                  />
                );
              }

              return (
                <Marker
                  key={`marker-${cluster.properties.latitude}-${cluster.properties.longitude}-${cluster.properties.productId}`}
                  position={[latitude, longitude]}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) =>
                      onHandleDragMarkerOver(e, cluster.properties.productId),
                  }}
                >
                  <Popup>
                    <div>
                      <p>Product ID: {cluster.properties.productId}</p>
                      <p>Product Name: {cluster.properties.product_name}</p>
                      <p>Order ID: {cluster.properties.order_id}</p>
                      <p>Lat: {cluster.properties.latitude}</p>
                      <p>Lng: {cluster.properties.longitude}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>

      <MapEvents />
    </MapContainer>
  );
};

export default LeafleatMap;