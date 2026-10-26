"use client"

import React, { useState, useRef } from "react"
import { X, UploadCloud, ArrowRight, CheckCircle2, Loader2, AlertCircle, AlertTriangle, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import type { FieldDefinition } from "@/types"
import {
  useCreateFieldMutation,
  useInsertItemsMutation,
  useCreateItemLiveMutation
} from "@/redux/api/dataApi"
import { generateSlug } from "@/lib/helper"

interface ReferenceItem {
  id: string
  fieldData: Record<string, any>
}

interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
  siteId: string
  collectionId: string
  collectionSchema: FieldDefinition[]
  collections: any[]
  referenceCollections: Record<string, ReferenceItem[]>
  isLiveMode: boolean
  onComplete: () => void
}

const SUPPORTED_FIELD_TYPES = [
  { label: "Plain Text", value: "PlainText" },
  { label: "Rich Text", value: "RichText" },
  { label: "Image", value: "Image" },
  { label: "Multi-Image", value: "MultiImage" },
  { label: "Video Link", value: "VideoLink" },
  { label: "Link", value: "Link" },
  { label: "Email", value: "Email" },
  { label: "Phone", value: "Phone" },
  { label: "Number", value: "Number" },
  { label: "Date / Time", value: "DateTime" },
  { label: "Color", value: "Color" },
  { label: "Switch", value: "Switch" },
  { label: "File", value: "File" },
  { label: "Option", value: "Option" },
  { label: "Reference", value: "Reference" },
  { label: "Multi-Reference", value: "MultiReference" },
]

const SYSTEM_CSV_FIELDS = [
  "item id", "created on", "updated on", "published on",
  "archived", "draft", "collection id", "locale id",
  "id", "_id", "created by", "updated by", "created-on", "updated-on", "published-on"
]

const checkCompatibility = (
  targetField: FieldDefinition, 
  csvSample: string, 
  referenceCollections: Record<string, ReferenceItem[]>
): { isCompatible: boolean; reason?: string } => {
  const val = csvSample.trim();
  if (!val) return { isCompatible: true }; 

  const isWebflowId = /^[a-f0-9]{24}$/i.test(val); 

  switch (targetField.type) {
    case 'Number':
      if (isNaN(Number(val))) return { isCompatible: false, reason: "Expects a Number, but contains text." }
      break;
    case 'Switch':
      const lowerVal = val.toLowerCase();
      if (!['true', 'false', 'yes', 'no', '1', '0'].includes(lowerVal)) {
        return { isCompatible: false, reason: "Expects True/False format." }
      }
      break;
    case 'Reference': {
      const refItems = referenceCollections[targetField.slug] || [];
      const isMatch = refItems.some(item => {
        const nameMatch = item.fieldData?.name?.toLowerCase() === val.toLowerCase();
        const slugMatch = item.fieldData?.slug?.toLowerCase() === val.toLowerCase();
        return nameMatch || slugMatch || item.id === val;
      });
      
      if (!isWebflowId && !isMatch) {
        return { isCompatible: false, reason: `Cannot find "${val}" in the referenced collection.` }
      }
      break;
    }
    case 'MultiReference': {
      const values = val.split(/[,\n;]/).map(v => v.trim()).filter(Boolean);
      const refItems = referenceCollections[targetField.slug] || [];
      
      const invalidItems = values.filter(v => {
        const isId = /^[a-f0-9]{24}$/i.test(v);
        const isMatch = refItems.some(item => {
          const nameMatch = item.fieldData?.name?.toLowerCase() === v.toLowerCase();
          const slugMatch = item.fieldData?.slug?.toLowerCase() === v.toLowerCase();
          return nameMatch || slugMatch || item.id === v;
        });
        return !isId && !isMatch;
      });

      if (invalidItems.length > 0) {
        return { isCompatible: false, reason: `Cannot find items: ${invalidItems.join(', ')}` }
      }
      break;
    }
    case 'Option': {
      const options = targetField.validations?.options || (targetField as any).metadata?.options || [];
      const isOptionMatch = options.some((o: any) => o.name.toLowerCase() === val.toLowerCase() || o.id === val);
      if (!isOptionMatch && options.length > 0) {
        return { isCompatible: false, reason: `"${val}" is not a valid option for this field.` }
      }
      break;
    }
    case 'Image':
    case 'File':
      if (!val.startsWith('http')) {
        return { isCompatible: false, reason: "Must be a valid public URL starting with http/https." }
      }
      break;
    default:
      break;
  }
  return { isCompatible: true };
}

const detectFieldType = (sampleData: string): string => {
  if (!sampleData) return "PlainText"
  const val = sampleData.trim()
  const lowerVal = val.toLowerCase()
  
  if (lowerVal === "true" || lowerVal === "false") return "Switch"
  if (/^https?:\/\/.*\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(val) || val.includes('cdn.prod.website-files.com')) return "Image"
  if (val.includes("<") && val.includes(">") && val.includes("</")) return "RichText"
  if (!isNaN(Number(val)) && val !== "") return "Number"
  if (!isNaN(Date.parse(val)) && (val.includes("-") || val.includes("GMT") || val.includes("UTC") || val.includes(","))) return "DateTime"
  
  return "PlainText"
}

const parseCSV = (str: string) => {
  const arr: string[][] = []
  let quote = false
  let row = 0, col = 0, c = 0
  for (; c < str.length; c++) {
    const cc = str[c], nc = str[c + 1]
    arr[row] = arr[row] || []
    arr[row][col] = arr[row][col] || ''
    if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue }
    if (cc == '"') { quote = !quote; continue }
    if (cc == ',' && !quote) { ++col; continue }
    if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue }
    if (cc == '\n' && !quote) { ++row; col = 0; continue }
    if (cc == '\r' && !quote) { ++row; col = 0; continue }
    arr[row][col] += cc
  }
  return arr.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''))
}

export default function CsvImportModal({
  isOpen, onClose, siteId, collectionId, collectionSchema, collections, referenceCollections, isLiveMode, onComplete
}: CsvImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [hasHeader, setHasHeader] = useState<boolean>(true)
  
  const [createField] = useCreateFieldMutation()
  const [insertStagingItems] = useInsertItemsMutation()
  const [insertLiveItems] = useCreateItemLiveMutation()

  const [mappings, setMappings] = useState<Record<number, {
    action: "map" | "create" | "ignore"
    targetFieldSlug?: string
    newFieldName?: string
    newFieldType?: string
    newFieldOptions?: string
    newFieldTargetCollection?: string
    warning?: string
    isSmartMapped?: boolean
  }>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length > 0) {
        setCsvData(parsed)
        setStep(2)
      } else {
        toast.error("CSV file is empty or invalid.")
      }
    }
    reader.readAsText(file)
  }

  const handleHeaderConfirm = () => {
    const initialMappings: any = {}
    const headerRow = hasHeader ? csvData[0] : csvData[0].map((_, i) => `Column ${i + 1}`)
    
    headerRow.forEach((colName, index) => {
      const lowerColName = colName.toLowerCase().trim()
      const sampleData = hasHeader ? (csvData[1]?.[index] || "") : (csvData[0]?.[index] || "")
      
      if (SYSTEM_CSV_FIELDS.includes(lowerColName)) {
        initialMappings[index] = {
          action: "ignore", targetFieldSlug: "", newFieldName: colName, newFieldType: "PlainText"
        }
        return
      }

      const matchedField = collectionSchema.find(f => 
        f.slug.toLowerCase() === lowerColName.replace(/\s+/g, '-') || 
        f.displayName?.toLowerCase() === lowerColName ||
        f.slug.toLowerCase() === lowerColName
      )
      
      if (matchedField) {
        const compCheck = checkCompatibility(matchedField, sampleData, referenceCollections)
        
        initialMappings[index] = {
          action: "map",
          targetFieldSlug: matchedField.slug,
          newFieldName: colName,
          newFieldType: "PlainText",
          warning: compCheck.isCompatible ? undefined : compCheck.reason,
          isSmartMapped: compCheck.isCompatible
        }
      } else {
        initialMappings[index] = {
          action: "create",
          targetFieldSlug: "",
          newFieldName: colName,
          newFieldType: detectFieldType(sampleData),
          newFieldOptions: "",
          newFieldTargetCollection: collections[0]?.id || ""
        }
      }
    })
    
    setMappings(initialMappings)
    setStep(3)
  }

  const handleUpdateMapping = (index: number, key: string, value: string) => {
    setMappings(prev => {
      const updated = { ...prev, [index]: { ...prev[index], [key]: value } }
      
      if (key === 'targetFieldSlug' || key === 'action') {
        if (updated[index].action === 'map' && updated[index].targetFieldSlug) {
           const targetField = collectionSchema.find(f => f.slug === updated[index].targetFieldSlug)
           const sampleData = hasHeader ? (csvData[1]?.[index] || "") : (csvData[0]?.[index] || "")
           if (targetField) {
             const compCheck = checkCompatibility(targetField, sampleData, referenceCollections)
             updated[index].warning = compCheck.isCompatible ? undefined : compCheck.reason
             updated[index].isSmartMapped = compCheck.isCompatible
           }
        } else {
           updated[index].warning = undefined
           updated[index].isSmartMapped = false
        }
      }
      return updated
    })
  }

  const executeImport = async () => {
    setStep(4) 
    try {
      const finalMappings = { ...mappings }
      const currentSchema = [...collectionSchema]
      
      for (const index of Object.keys(finalMappings)) {
        const idx = Number(index)
        const map = finalMappings[idx]
        
        if (map.action === "create" && map.newFieldName) {
          const fieldNameToCreate = map.newFieldName.trim();
          
          // 🔍 চেক করুন ফিল্ডটি অলরেডি স্কিমায় আছে কি না (ডুপ্লিকেট এড়াতে)
          const existingField = currentSchema.find(
            f => f.displayName?.toLowerCase() === fieldNameToCreate.toLowerCase() ||
                f.slug === generateSlug(fieldNameToCreate)
          );

          if (existingField) {
            // যদি ফিল্ডটি আগেই থাকে, তবে নতুন করে ক্রিয়েট না করে জাস্ট সেটা ম্যাপ করে দিন!
            finalMappings[idx].action = "map";
            finalMappings[idx].targetFieldSlug = existingField.slug;
            continue; // পরের লুপে চলে যান
          }

          const bodyPayload: any = {
            displayName: fieldNameToCreate,
            type: map.newFieldType || "PlainText",
            isRequired: false
          }

          if (map.newFieldType === "Option" && map.newFieldOptions) {
            bodyPayload.metadata = {
              options: map.newFieldOptions.split(',').map(s => ({ name: s.trim() })).filter(o => o.name)
            }
          } else if ((map.newFieldType === "Reference" || map.newFieldType === "MultiReference") && map.newFieldTargetCollection) {
            bodyPayload.metadata = { collectionId: map.newFieldTargetCollection }
          }

          try {
            // ব্যাকএন্ডে ফিল্ড ক্রিয়েট কল
            const res = await createField({ siteId, collectionId, body: bodyPayload }).unwrap()
            
            const createdSlug = (res as any)?.data?.slug || (res as any)?.slug || generateSlug(fieldNameToCreate)
            finalMappings[idx].targetFieldSlug = createdSlug
            
            currentSchema.push({
              id: (res as any)?.data?.id || (res as any)?.id,
              slug: createdSlug,
              type: map.newFieldType || "PlainText",
              validations: bodyPayload.metadata, 
            } as any)
          } catch (err: any) {
            console.warn(`Field "${fieldNameToCreate}" might already exist, attempting to map...`, err);
          }
        }
      }

      // 📦 2. Build Items Payload (with newly created fields mapped properly)
      const startIndex = hasHeader ? 1 : 0
      const itemsToInsert = []

      for (let i = startIndex; i < csvData.length; i++) {
        const row = csvData[i]
        const fieldData: Record<string, any> = {}
        let hasValidData = false;
        
        row.forEach((cellValue, idx) => {
          const map = finalMappings[idx]
          if (map.action !== "ignore" && map.targetFieldSlug && cellValue.trim() !== "") {
            hasValidData = true;
            const targetField = currentSchema.find(f => f.slug === map.targetFieldSlug)
            const fieldType = targetField ? targetField.type : map.newFieldType
            let formattedValue: any = cellValue.trim()

            switch (fieldType) {
              case "Number": 
                formattedValue = Number(formattedValue); 
                break;
              case "Switch": 
                formattedValue = (['true','1','yes'].includes(formattedValue.toLowerCase())); 
                break;
              case "Image":
              case "File": 
                formattedValue = { url: formattedValue }; 
                break;
              case "MultiImage": 
                formattedValue = formattedValue.split(/[,\n]/).map((url: string) => ({ url: url.trim() })).filter((img: any) => img.url); 
                break;
              case "Reference": {
                const refItems = referenceCollections[map.targetFieldSlug] || [];
                const match = refItems.find(item => 
                  item.fieldData?.name?.toLowerCase() === formattedValue.toLowerCase() || 
                  item.fieldData?.slug?.toLowerCase() === formattedValue.toLowerCase() || 
                  item.id === formattedValue
                );
                if (match) formattedValue = match.id;
                break;
              }
              case "MultiReference": {
                const mRefItems = referenceCollections[map.targetFieldSlug] || [];
                formattedValue = formattedValue.split(/[,\n;]/).map((val: string) => {
                  const mMatch = mRefItems.find(item => 
                    item.fieldData?.name?.toLowerCase() === val.trim().toLowerCase() || 
                    item.fieldData?.slug?.toLowerCase() === val.trim().toLowerCase() || 
                    item.id === val.trim()
                  );
                  return mMatch ? mMatch.id : val.trim();
                }).filter(Boolean);
                break;
              }
              case "DateTime":
                const dateObj = new Date(formattedValue)
                if (!isNaN(dateObj.getTime())) formattedValue = dateObj.toISOString()
                break;
              case "Option":
                if (targetField) {
                  const options = targetField.validations?.options || (targetField as any).metadata?.options || []
                  const matchedOption = options.find((o: any) => o.name.toLowerCase() === formattedValue.toLowerCase() || o.id === formattedValue)
                  if (matchedOption) formattedValue = matchedOption.id
                }
                break;
              default: 
                break;
            }
            fieldData[map.targetFieldSlug] = formattedValue
          }
        })

        if (!fieldData.name && fieldData.name !== "") fieldData.name = `Imported Item ${i}`
        
        if (hasValidData) itemsToInsert.push({ fieldData })
      }

      if (itemsToInsert.length === 0) {
        toast.error("No valid items found to import.")
        setStep(3)
        return
      }

      // 📥 3. Insert All Items Payload in Bulk/Batch
      const payload = { items: itemsToInsert }
      if (isLiveMode) {
        await insertLiveItems({ siteId, collectionId, body: payload }).unwrap()
      } else {
        await insertStagingItems({ siteId, collectionId, body: payload }).unwrap()
      }

      toast.success(`Successfully imported ${itemsToInsert.length} items!`)
      onComplete()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.data?.message || "Failed to import items. Please check warnings and field formats.")
      setStep(3) 
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
          <h2 className="text-base font-semibold">Import CSV to Collection</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-20">
              <UploadCloud className="size-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
              <p className="text-sm text-muted-foreground mb-6">Drag and drop or click to browse</p>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <Button onClick={() => fileInputRef.current?.click()} className="bg-primary text-primary-foreground">
                Browse Files
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-xl mx-auto py-10 space-y-6">
              <h3 className="text-lg font-medium text-center">Is this your CSV's header row?</h3>
              <div className="bg-accent/30 rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <tbody>
                    <tr className="bg-accent font-medium">
                      {csvData[0]?.slice(0, 4).map((cell, i) => (
                        <td key={i} className="p-3 border-r border-border truncate max-w-[120px]">{cell}</td>
                      ))}
                      {csvData[0]?.length > 4 && <td className="p-3 text-muted-foreground">...</td>}
                    </tr>
                    <tr>
                      {csvData[1]?.slice(0, 4).map((cell, i) => (
                        <td key={i} className="p-3 border-r border-border truncate max-w-[120px] text-muted-foreground">{cell}</td>
                      ))}
                      {csvData[1]?.length > 4 && <td className="p-3">...</td>}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/40">
                  <input type="radio" checked={hasHeader} onChange={() => setHasHeader(true)} className="size-4" />
                  <span>Yes, the first row contains field names</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/40">
                  <input type="radio" checked={!hasHeader} onChange={() => setHasHeader(false)} className="size-4" />
                  <span>No, it's just data items</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleHeaderConfirm} className="gap-2">Continue <ArrowRight size={16}/></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                   <h3 className="text-lg font-medium">Field Configuration</h3>
                   <p className="text-xs text-muted-foreground">Cross-check how your CSV columns map to Webflow fields.</p>
                </div>
                <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {csvData.length - (hasHeader ? 1 : 0)} items to import
                </span>
              </div>
              
              <div className="grid grid-cols-[1.5fr_1fr_2fr] gap-4 font-medium text-xs text-muted-foreground pb-2 border-b border-border px-2">
                <div>CSV Column & Preview</div>
                <div>Action</div>
                <div>Webflow Target Field</div>
              </div>

              <div className="space-y-4">
                {(hasHeader ? csvData[0] : csvData[0].map((_, i) => `Column ${i + 1}`)).map((colName, idx) => {
                  
                  const lowerColName = colName.toLowerCase().trim()
                  if (SYSTEM_CSV_FIELDS.includes(lowerColName)) {
                    return null;
                  }

                  const mapConfig = mappings[idx]
                  const sampleData = hasHeader ? csvData[1]?.[idx] : csvData[0]?.[idx]
                  const hasWarning = !!mapConfig?.warning

                  return (
                    <div key={idx} className={`grid grid-cols-[1.5fr_1fr_2fr] gap-4 items-start p-3 rounded-lg border transition-colors ${hasWarning ? 'bg-amber-500/5 border-amber-500/30' : 'bg-accent/20 border-border'}`}>
                      
                      <div className="overflow-hidden pt-1">
                        <div className="font-semibold text-sm truncate" title={colName}>{colName}</div>
                        <div className="text-xs text-muted-foreground truncate mt-1" title={sampleData}>{sampleData || <i className="opacity-50">Empty</i>}</div>
                      </div>

                      <div>
                        <select 
                          className="w-full text-xs p-2 rounded-md bg-background border border-border outline-none cursor-pointer"
                          value={mapConfig?.action}
                          onChange={(e) => handleUpdateMapping(idx, 'action', e.target.value)}
                        >
                          <option value="ignore">🚫 Do not import</option>
                          <option value="map">🔗 Map to existing</option>
                          <option value="create">✨ Create new field</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        {mapConfig?.action === "map" && (
                          <div className="relative">
                            <select 
                              className={`w-full text-xs p-2 rounded-md bg-background border outline-none cursor-pointer ${hasWarning ? 'border-amber-500/50' : 'border-border'}`}
                              value={mapConfig.targetFieldSlug || ""}
                              onChange={(e) => handleUpdateMapping(idx, 'targetFieldSlug', e.target.value)}
                            >
                              <option value="" disabled>Select existing field...</option>
                              {collectionSchema.map(f => (
                                <option key={f.slug} value={f.slug}>{f.displayName || f.slug} ({f.type})</option>
                              ))}
                            </select>
                            {mapConfig.isSmartMapped && !hasWarning && (
                               <div className="absolute right-8 top-2 text-primary" title="Smart Mapped">
                                  <Wand2 size={14} />
                               </div>
                            )}
                          </div>
                        )}

                        {mapConfig?.action === "create" && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={mapConfig.newFieldName} 
                                onChange={(e) => handleUpdateMapping(idx, 'newFieldName', e.target.value)}
                                className="flex-1 text-xs p-2 rounded-md bg-background border border-border outline-none"
                                placeholder="Field Name"
                              />
                              <select 
                                className="w-32 text-xs p-2 rounded-md bg-background border border-border outline-none cursor-pointer"
                                value={mapConfig.newFieldType}
                                onChange={(e) => handleUpdateMapping(idx, 'newFieldType', e.target.value)}
                              >
                                {SUPPORTED_FIELD_TYPES.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </div>

                            {mapConfig.newFieldType === "Option" && (
                              <input 
                                type="text"
                                placeholder="Comma separated options (e.g. Red, Blue, Green)"
                                value={mapConfig.newFieldOptions}
                                onChange={(e) => handleUpdateMapping(idx, 'newFieldOptions', e.target.value)}
                                className="w-full text-xs p-2 rounded-md bg-primary/5 border border-primary/20 outline-none"
                              />
                            )}

                            {(mapConfig.newFieldType === "Reference" || mapConfig.newFieldType === "MultiReference") && (
                              <select 
                                className="w-full text-xs p-2 rounded-md bg-primary/5 border border-primary/20 outline-none cursor-pointer"
                                value={mapConfig.newFieldTargetCollection}
                                onChange={(e) => handleUpdateMapping(idx, 'newFieldTargetCollection', e.target.value)}
                              >
                                <option value="" disabled>Select Target Collection...</option>
                                {collections.map(col => (
                                  <option key={col.id} value={col.id}>{col.displayName || col.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                        
                        {mapConfig?.action === "ignore" && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                            <AlertCircle size={14}/> Column data will be ignored
                          </div>
                        )}

                        {mapConfig?.action === "map" && hasWarning && (
                           <div className="text-[11px] font-medium text-amber-500 flex items-start gap-1.5 bg-amber-500/10 p-2 rounded-md border border-amber-500/20 mt-2">
                             <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                             <span>{mapConfig.warning}</span>
                           </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={executeImport} className="bg-primary text-primary-foreground gap-2">
                  <CheckCircle2 size={16} /> Run Import
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="size-10 animate-spin text-primary" />
              <h3 className="text-lg font-medium text-foreground">Importing your data...</h3>
              <p className="text-sm text-muted-foreground">Please do not close this window. We are formatting and inserting items into your collection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}