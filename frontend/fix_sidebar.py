import sys

with open('/home/frey/Visual Studio Code/A/college/Graduation Project/frontend/components/notes/note-editor-page.tsx', 'r') as f:
    content = f.read()

# find right sidebar start
start_idx = content.find('{/* RIGHT SIDEBAR */}')
end_idx = content.find('      </div>\n    </TooltipProvider>', start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find boundaries")
    sys.exit(1)

new_sidebar = """{/* RIGHT SIDEBAR */}
        <div className="flex w-full shrink-0 flex-col space-y-8 pt-2 lg:sticky lg:top-14 lg:w-[260px] pb-12 lg:pl-6 border-l border-border/20">
          
          {/* PROPERTIES */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Properties</h3>
            <div className="flex flex-col gap-2.5">
              
              {/* Folder Selector */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground w-20 shrink-0 flex items-center gap-2">Folder</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-7 flex-1 justify-start text-xs font-normal px-2 -mr-2 text-foreground/80 hover:bg-accent/50 w-full justify-between group">
                      {folderId ? (
                        <span className="truncate">{detailQuery.data.folders.find((f: any) => f.id === folderId)?.name}</span>
                      ) : (
                        <span className="text-muted-foreground opacity-70">Add to folder...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search folders..." className="h-8 text-xs" />
                      <CommandList>
                        <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">No folder found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem 
                             className="text-xs"
                             onSelect={() => {setFolderId(""); setDirty(true);}}
                          >
                            <span className="text-muted-foreground">Clear folder</span>
                          </CommandItem>
                          {detailQuery.data.folders.map((folder: any) => (
                            <CommandItem 
                               key={folder.id} 
                               className="text-xs"
                               onSelect={() => {setFolderId(folder.id); setDirty(true);}}
                            >
                              {folder.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tags Selector */}
              <div className="flex items-start justify-between min-h-[32px] pt-1 text-sm">
                <span className="text-muted-foreground w-20 shrink-0 flex items-center gap-2 pt-1.5">Tags</span>
                <div className="flex flex-wrap gap-1 flex-1 items-center justify-end">
                  {detailQuery.data.tags.filter((t: any) => tagSet.has(t.id)).map((tag: any) => (
                     <Badge key={tag.id} variant="secondary" className="px-1.5 h-5 text-[10px] font-medium rounded bg-accent text-accent-foreground border-transparent hover:bg-accent/80 tracking-tight">
                        {tag.name}
                     </Badge>
                  ))}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-5 px-1.5 -mr-1.5 text-[10px] text-muted-foreground opacity-70 hover:opacity-100 hover:bg-accent/50 rounded">
                        {tagSet.size === 0 ? "Add tags..." : "+ Add"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Search tags..." className="h-8 text-xs" />
                        <CommandList>
                          <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">No tag found.</CommandEmpty>
                          <CommandGroup>
                            {detailQuery.data.tags.map((tag: any) => {
                              const isSelected = tagSet.has(tag.id);
                              return (
                                <CommandItem 
                                  key={tag.id} 
                                  className={cn("text-xs flex justify-between", isSelected ? "bg-accent/50" : "")}
                                  onSelect={() => {
                                    const next = isSelected ? selectedTagIds.filter(id => id !== tag.id) : [...selectedTagIds, tag.id];
                                    setSelectedTagIds(next);
                                    updateTags.mutate(next);
                                  }}
                                >
                                  {tag.name}
                                  {isSelected && <span className="opacity-50">✓</span>}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Share */}
              <div className="flex items-center justify-between text-sm pt-0.5">
                 <span className="text-muted-foreground w-20 shrink-0 flex items-center gap-2">Share</span>
                 <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="h-7 flex-1 justify-start text-xs font-normal px-2 -mr-2 hover:bg-accent/50 text-foreground/80 w-full">
                        {sharesQuery.data && sharesQuery.data.length > 0 ? `${sharesQuery.data.length} active links` : <span className="text-muted-foreground opacity-70">Private</span>}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-lg">Share Note</DialogTitle>
                        <DialogDescription className="text-xs">
                          Collaborate with users or generate secure links.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sharing Method</label>
                          <Popover open={shareModePickerOpen} onOpenChange={setShareModePickerOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start h-9 text-sm font-normal">
                                {shareMode === "user" ? "Share with specific user" : "Generate shareable link"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-full">
                              <Command>
                                <CommandList>
                                  <CommandGroup>
                                    <CommandItem onSelect={() => { setShareMode("user"); setShareModePickerOpen(false); }} className="text-sm">
                                      Share with specific user
                                    </CommandItem>
                                    <CommandItem onSelect={() => { setShareMode("link"); setShareModePickerOpen(false); }} className="text-sm">
                                      Generate shareable link
                                    </CommandItem>
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {shareMode === "user" ? (
                          <div className="space-y-2">
                             <Input
                               value={recipientUserId}
                               onChange={(event) => setRecipientUserId(event.target.value)}
                               placeholder="Enter user UUID..."
                               className="h-9 text-sm"
                             />
                          </div>
                        ) : (
                          <div className="rounded border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground/80">
                            A secure anonymous token will be generated allowing anyone with the link to access this note.
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Permissions</label>
                            <div className="flex items-center gap-2">
                              <input
                                id="share-can-edit"
                                type="checkbox"
                                checked={shareCanEdit}
                                onChange={(event) => setShareCanEdit(event.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <label htmlFor="share-can-edit" className="text-xs font-medium cursor-pointer">
                                Can Edit
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Expiration</label>
                            <select
                              value={expiryDays}
                              onChange={(event) => setExpiryDays(event.target.value)}
                              className="h-8 w-full rounded border border-input px-2 text-xs bg-background"
                            >
                              <option value="never">Never expires</option>
                              <option value="1">24 hours</option>
                              <option value="7">7 days</option>
                              <option value="30">30 days</option>
                            </select>
                          </div>
                        </div>

                        <Button className="w-full h-9" onClick={handleCreateShare} disabled={createShare.isPending}>
                          {createShare.isPending ? "Configuring..." : "Confirm Share"}
                        </Button>

                        {shareFeedback && (
                          <p className="rounded bg-muted/50 p-2 text-center text-xs font-medium text-foreground">
                            {shareFeedback}
                          </p>
                        )}

                        {sharesQuery.data && sharesQuery.data.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/40">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Shares</p>
                            {sharesQuery.data.map((share: any) => (
                              <div key={share.id} className="flex items-center justify-between gap-3 rounded border border-border/40 bg-muted/30 p-2">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold text-foreground/90">
                                    {formatShareTarget(share)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {share.can_edit ? "Edit access" : "View only"} • {share.expires_at ? `Exp ${new Date(share.expires_at).toLocaleDateString()}` : "No expiry"}
                                  </p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  {share.share_token && (
                                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => copyShareToken(share.share_token as string)}>
                                      Copy
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteShare.mutateAsync(share.id)}>
                                    Revoke
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                 </Dialog>
              </div>

            </div>
          </div>

          <div className="h-px bg-border/40 w-full" />

          {/* AI ACTIONS */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Assistant
            </h3>
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs justify-start px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={() => embedNoteMutation.mutate(noteId)}
              >
                {embedNoteMutation.isPending ? "Syncing..." : "Sync Context Vector"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs justify-start px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={async () => {
                  const result = await summaryMutation.mutateAsync();
                  setSummaryText(result.summary);
                }}
              >
                {summaryMutation.isPending ? "Extracting..." : "Generate Summary"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs justify-start px-3 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={async () => {
                  const result = await suggestTagsMutation.mutateAsync();
                  setSuggestedTagsText(result.tags);
                }}
              >
                {suggestTagsMutation.isPending
                  ? "Analyzing..."
                  : "Auto-Tag Document"}
              </Button>
            </div>

            {summaryText && (
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 mt-3">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Abstract</p>
                <p className="text-xs leading-relaxed text-foreground">
                  {summaryText}
                </p>
              </div>
            )}
            {suggestedTagsText.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {suggestedTagsText.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-1.5 py-0 h-5 text-[10px] font-medium bg-background text-muted-foreground border-border/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask anything..."
                className="min-h-[60px] w-full resize-none text-[13px] bg-transparent border-border/60 focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button
                size="sm"
                variant="secondary"
                className="mt-2 w-full h-8 text-xs bg-accent hover:bg-accent/80"
                onClick={() => askMutation.mutate(question)}
                disabled={question.trim().length < 4}
              >
                {askMutation.isPending ? "Reasoning..." : "Ask"}
              </Button>
              {askMutation.data?.answer && (
                <div className="mt-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                    {askMutation.data.answer}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-border/40 w-full" />

          {/* SEMANTIC SEARCH */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Discovery
            </h3>
            <div className="space-y-3">
               <div className="flex flex-col gap-2">
                 <Input
                   value={searchQuery}
                   onChange={(event) => setSearchQuery(event.target.value)}
                   placeholder="Search related topics..."
                   className="h-8 w-full px-3 text-[13px] bg-transparent border-border/60"
                 />
                 <div className="flex gap-2">
                   <Button
                     size="sm"
                     variant="outline"
                     className="flex-1 text-xs h-7 bg-transparent"
                     onClick={() =>
                       semanticSearchMutation.mutate({
                         query: searchQuery,
                         limit: 5,
                       })
                     }
                     disabled={searchQuery.trim().length < 2 || semanticSearchMutation.isPending}
                   >
                     {semanticSearchMutation.isPending ? "..." : "Search"}
                   </Button>
                   <Button
                     size="sm"
                     variant="ghost"
                     className="flex-1 text-xs h-7 hover:bg-accent/50"
                     onClick={() =>
                       semanticSearchMutation.mutate({ query: title, limit: 5 })
                     }
                     disabled={title.trim().length < 2 || semanticSearchMutation.isPending}
                   >
                     Auto-Find
                   </Button>
                 </div>
               </div>

               {(semanticSearchMutation.data?.matches ?? []).length > 0 && typeof semanticSearchMutation.data?.matches === 'object' && (
                 <div className="space-y-2 pt-2">
                   {(semanticSearchMutation.data?.matches ?? [])
                     .filter((item: any) => item.note_id !== noteId)
                     .map((match: any) => (
                       <Link
                         href={`/notes/${match.note_id}`}
                         key={match.chunk_id}
                         className="block rounded-lg border border-transparent p-2.5 transition-colors hover:bg-accent"
                       >
                         <p className="mb-0.5 text-xs font-semibold leading-tight text-foreground line-clamp-1">
                           {match.title}
                         </p>
                         <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                           {match.chunk_text}
                         </p>
                       </Link>
                     ))}
                   {semanticSearchMutation.data?.matches.filter(
                     (item: any) => item.note_id !== noteId,
                   ).length === 0 && (
                     <p className="py-1 text-center text-xs text-muted-foreground italic">
                       No sibling context found.
                     </p>
                   )}
                 </div>
               )}
            </div>
          </div>
"""

new_content = content[:start_idx] + new_sidebar + content[end_idx:]

with open('/home/frey/Visual Studio Code/A/college/Graduation Project/frontend/components/notes/note-editor-page.tsx', 'w') as f:
    f.write(new_content)

print("success")
