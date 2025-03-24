"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Box, Tab, Tabs, TextField } from "@mui/material";
import { Search } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

const XmlViewerDialog = React.forwardRef((_, ref) => {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(0);
    const [formattedXml, setFormattedXml] = React.useState<string>("<orders></orders>");

    const [searchByCityForm, setSearchByCityForm] = React.useState({
        city_name: "",
    });

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    React.useImperativeHandle(ref, () => ({
        handleClickOpen() {
            setOpen(true);
        },
    }));

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const params = {
            city_name: searchByCityForm.city_name,
        };

        try {
            const response = await fetch("/api/xml/filter-by-city", {
                method: "POST",
                body: JSON.stringify(params),
                headers: {
                    "content-type": "application/json",
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                toast.error(`Error: ${errorText}`);
                return;
            }

            const jsonResponse = await response.json();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(jsonResponse.xml_data, "application/xml");
            const serializer = new XMLSerializer();
            const formattedXml = serializer.serializeToString(xmlDoc);

            setFormattedXml(formattedXml);
            toast.success("Dados fetched com sucesso!");
        } catch (error) {
            console.error("Erro fetching dados XML:", error);
            toast.error("Falha ao dar fetch nos dados XML");
        }
    };

    return (
        <React.Fragment>
            <ToastContainer />

            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"XML Viewer"}</DialogTitle>

                <DialogContent>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            aria-label="basic tabs example"
                        >
                            <Tab label="Procure pedidos por cidade" {...a11yProps(0)} />
                        </Tabs>
                    </Box>

                    <CustomTabPanel value={value} index={0}>
                        <Box
                            className="px-0"
                            component="form"
                            onSubmit={handleSubmit}
                        >
                            <TextField
                                label="Nome da cidade"
                                fullWidth
                                margin="normal"
                                value={searchByCityForm.city_name}
                                onChange={(e: any) => {
                                    setSearchByCityForm({
                                        ...searchByCityForm,
                                        city_name: e.target.value,
                                    });
                                }}
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

                        <pre
                            className="my-4 mx-0"
                            style={{
                                fontFamily: "monospace",
                                whiteSpace: "pre-wrap",
                                wordWrap: "break-word",
                            }}
                        >
                            <code>{formattedXml}</code>
                        </pre>
                    </CustomTabPanel>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
});

export default XmlViewerDialog;