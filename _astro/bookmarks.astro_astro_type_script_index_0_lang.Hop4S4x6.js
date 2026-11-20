var e=`bookmarks`;function t(){try{let t=localStorage.getItem(e);if(!t)return[];let n=JSON.parse(t);return Array.isArray(n)?n.filter(e=>!!e&&typeof e==`object`&&typeof e.href==`string`&&typeof e.title==`string`&&typeof e.savedAt==`string`):[]}catch{return[]}}function n(t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}var r=document.querySelector(`[data-bookmark-list]`),i=document.querySelector(`[data-bookmark-count]`),a=document.querySelector(`[data-empty-message]`),o=document.querySelector(`[data-bookmarks-search]`),s=document.querySelector(`[data-clear-search]`),c=`No bookmarks yet. Open any article on this site and hit the bookmark icon to save it here.`,l=`No bookmarks match your search.`;if(r){let e=new Intl.DateTimeFormat(`en`,{dateStyle:`medium`,timeStyle:`short`}),u=e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`),d=t=>{r.innerHTML=``,i&&(i.textContent=String(t.length)),a&&(a.hidden=t.length>0);for(let n of t){let t=document.createElement(`article`);t.className=`group relative h-full rounded-md border border-smooth-border bg-surface p-6 transition-colors duration-100 hover:border-journal-accent/60`,t.innerHTML=`
                <div class="relative flex h-full flex-col gap-1.5">
                    <div class="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs word-spacing-wide font-medium text-neutral-500">
                        <time datetime="${u(n.savedAt)}">Saved ${u(e.format(new Date(n.savedAt)))}</time>
                        <button
                            type="button"
                            data-bookmark-remove="${u(n.href)}"
                            aria-label="Remove bookmark"
                            title="Remove bookmark"
                            class="shrink-0 cursor-pointer rounded-md p-1.5 text-neutral-400 transition-colors duration-100 hover:text-journal-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-journal-accent"
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>

                    <div class="mb-2 flex flex-col gap-1.5">
                        <h3 class="line-clamp-2 text-lg font-semibold">
                            <a
                                href="${u(n.href)}"
                                class="transition-colors duration-100 hover:text-journal-accent-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-journal-accent"
                            >
                                ${u(n.title)}
                            </a>
                        </h3>

                        <p class="max-w-3xl line-clamp-3 text-sm text-neutral-500">
                            ${u(n.description)}
                        </p>
                    </div>

                    <div class="mt-auto flex items-center justify-between gap-3 border-t border-smooth-border pt-4">
                        <span class="truncate text-xs word-spacing-wide font-medium text-journal-accent-text">
                            ${u(n.tag)}
                        </span>

                        <a
                            href="${u(n.href)}"
                            aria-label="Read ${u(n.title)}"
                            class="inline-flex shrink-0 items-center gap-1 text-xs word-spacing-wide font-medium text-neutral-600 underline transition-colors duration-100 hover:text-journal-accent-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-journal-accent"
                        >
                            read more
                        </a>
                    </div>
                </div>
            `,r.appendChild(t)}},f=t(),p=()=>{let e=o?.value.trim().toLowerCase()??``;return e?f.filter(t=>`${t.title} ${t.description} ${t.tag}`.toLowerCase().includes(e)):f},m=()=>{d(p()),a&&(a.textContent=f.length===0?c:l)};o?.addEventListener(`input`,()=>{s&&(s.hidden=!o.value),m()}),s?.addEventListener(`click`,()=>{o&&(o.value=``),s&&(s.hidden=!0),o?.focus(),m()}),r.addEventListener(`click`,e=>{let t=e.target?.closest(`button[data-bookmark-remove]`);if(!t)return;let r=t.getAttribute(`data-bookmark-remove`);r&&(f=f.filter(e=>e.href!==r),n(f),m())}),m()}