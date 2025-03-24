"use client";

import React, { useRef, useState } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Box,
  ListSubheader,
  ListItemButton,
  TextField,
  Button,
} from "@mui/material";
import UploadFilesDialog from "./UploadFilesDialog";
import XmlViewerDialog from "./XmlViewer";
import { Search } from "@mui/icons-material";
import { redirect } from "next/navigation";

const Sidebar = ({ searchValue }: { searchValue: string }) => {
  const uploadFilesDialogRef = useRef<any>(null);
  const xmlViewerDialog = useRef<any>(null);

  const [searchByCityForm, setSearchByCityForm] = useState({
    city: searchValue,
  });

  const handleOpenUploadFilesDialog = () => {
    uploadFilesDialogRef.current?.handleClickOpen();
  };

  const handleXmlViewerDialog = () => {
    xmlViewerDialog.current?.handleClickOpen();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedCity = searchByCityForm.city.trim();
    redirect(`/?search=${trimmedCity}`);
  };

  return (
    <>
      <UploadFilesDialog ref={uploadFilesDialogRef} />
      <XmlViewerDialog ref={xmlViewerDialog} />

      <List
        sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
        component="nav"
        aria-labelledby="nested-list-subheader"
        subheader={
          <ListSubheader
            className="text-black font-bold border-b-2"
            component="div"
            id="nested-list-subheader"
          >
            <p className="text-gray-700 font-bold text-xl my-4">
              Integração de Sistemas
            </p>
          </ListSubheader>
        }
      >
        <ListItem>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Procure pelo nome do produto"
              fullWidth
              margin="normal"
              value={searchByCityForm.city}
              onChange={(e) =>
                setSearchByCityForm({
                  ...searchByCityForm,
                  city: e.target.value,
                })
              }
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              startIcon={<Search />}
            >
              Procurar
            </Button>
          </Box>
        </ListItem>
        <ListItemButton onClick={handleOpenUploadFilesDialog}>
          <ListItemText className="text-gray-600" primary="Upload Ficheiros" />
        </ListItemButton>
        <ListItemButton onClick={handleXmlViewerDialog}>
          <ListItemText className="text-gray-600" primary="XMLs" />
        </ListItemButton>
      </List>
    </>
  );
};

export default Sidebar;