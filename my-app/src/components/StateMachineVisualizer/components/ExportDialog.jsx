/**
 * ExportDialog.jsx
 * 
 * Export confirmation dialog component (SRP).
 * Extracted from index.jsx to reduce complexity.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Export dialog component
 * Allows user to specify filename before exporting
 */
const ExportDialog = ({ 
  isOpen, 
  onClose, 
  filename = "", 
  onFilenameChange, 
  onConfirm,
  title = "Export State Machine",
  description = "Enter a filename for the export"
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => onFilenameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="state-machine"
              autoFocus
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              File will be exported as CSV format
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!filename || !filename.trim()}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ExportDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  filename: PropTypes.string,
  onFilenameChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  description: PropTypes.string
};

export default ExportDialog;
