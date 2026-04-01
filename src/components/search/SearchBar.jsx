import React, { useState } from 'react';
import { 
  Paper, 
  InputBase, 
  IconButton, 
  Autocomplete,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { 
  Search as SearchIcon
} from '@mui/icons-material';
import { useSettingsStore } from '../../store';

// 模拟搜索引擎数据
const ENGINES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com/favicon.ico' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
  { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com/favicon.ico' }
];

export default function SearchBar({ sites = [], openInNewTab = false }) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const searchEngineId = useSettingsStore(state => state.searchEngine);
  const setSearchEngine = useSettingsStore(state => state.setSearchEngine);
  const activeEngine = ENGINES.find(e => e.id === searchEngineId) || ENGINES[0];
  const [engineMenuAnchor, setEngineMenuAnchor] = useState(null);

  // Debounce the input value for matching
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300); // 300ms 停顿延迟

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // Compute matched sites based on debounced input
  const options = React.useMemo(() => {
    if (!debouncedValue.trim()) return [];
    const query = debouncedValue.toLowerCase();
    
    return sites.filter(site => {
      // 1. 匹配书签名称
      if (site.name && site.name.toLowerCase().includes(query)) {
        return true;
      }
      
      // 2. 匹配 URL 域名主体部分
      if (site.url) {
        try {
          const urlObj = new URL(site.url);
          let hostname = urlObj.hostname;
          // 移除常见的 www. 等前缀以便于匹配核心域名
          hostname = hostname.replace(/^www\./, '');
          if (hostname.toLowerCase().includes(query)) {
            return true;
          }
        } catch (e) {
          // 忽略无效的 URL
        }
      }
      
      return false;
    });
  }, [debouncedValue, sites]);

  const handleSearch = (query) => {
    if (typeof query === 'string' && query.trim()) {
      // It's a plain string search
      if (openInNewTab) {
        window.open(`${activeEngine.url}${encodeURIComponent(query.trim())}`, '_blank');
      } else {
        window.location.href = `${activeEngine.url}${encodeURIComponent(query.trim())}`;
      }
    } else if (query && query.url) {
      // It's a matched site object
      if (openInNewTab) {
        window.open(query.url, '_blank');
      } else {
        window.location.href = query.url;
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Only prevent default if we're actually searching, let Autocomplete handle option selection if open
      // The Autocomplete's internal onKeyDown will call onChange if an item is selected
      if (!options.length || !inputValue.trim()) {
        e.preventDefault();
        handleSearch(inputValue);
      }
    }
  };

  const handleEngineClick = (event) => {
    setEngineMenuAnchor(event.currentTarget);
  };

  const handleEngineClose = () => {
    setEngineMenuAnchor(null);
  };

  const handleEngineSelect = (engine) => {
    setSearchEngine(engine.id);
    handleEngineClose();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: 4, mb: 6 }}>
      <Autocomplete
        freeSolo
        options={options}
        filterOptions={(x) => x} // Disable built-in filtering since we pre-filter and debounce
        getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={(_, newValue) => {
          if (newValue) {
            handleSearch(newValue);
          }
        }}
        ListboxProps={{
          sx: {
            bgcolor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(30px) saturate(150%)',
            WebkitBackdropFilter: 'blur(30px) saturate(150%)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            mt: 1,
            '& .MuiAutocomplete-option': {
              '&[aria-selected="true"]': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
              },
              '&.Mui-focused, &:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }
            }
          }
        }}
        PaperComponent={({ children }) => (
          <Paper elevation={8} sx={{ bgcolor: 'transparent', backgroundImage: 'none' }}>
            {children}
          </Paper>
        )}
        renderInput={(params) => {
          const { InputLabelProps, InputProps, ...rest } = params;
          const { ref, ...inputPropsRest } = InputProps;
          return (
            <Paper
              elevation={0}
              ref={ref}
              sx={{ 
                p: '4px 8px', 
                display: 'flex', 
                alignItems: 'center', 
                width: '100%',
                borderRadius: '24px',
                bgcolor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'box-shadow 0.3s, background-color 0.3s',
                '&:hover, &:focus-within': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }
              }}
            >
              <IconButton 
                sx={{ p: '8px' }} 
                aria-label="engine"
                onClick={handleEngineClick}
              >
                <Box 
                  component="img" 
                  src={activeEngine.icon}
                  alt={activeEngine.name} 
                  sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'white', p: 0.2 }}
                  onError={(e) => {
                    /** @type {any} */
                    const target = e.target;
                    if (target && target.style) {
                      target.style.display = 'none';
                    }
                  }}
                />
              </IconButton>
              
              <Menu
                anchorEl={engineMenuAnchor}
                open={Boolean(engineMenuAnchor)}
                onClose={handleEngineClose}
                PaperProps={{
                  elevation: 3,
                  sx: { mt: 1.5, borderRadius: 2 }
                }}
              >
                {ENGINES.map((engine) => (
                  <MenuItem 
                    key={engine.id} 
                    selected={engine.id === activeEngine.id}
                    onClick={() => handleEngineSelect(engine)}
                  >
                    <ListItemIcon>
                      <Box 
                        component="img" 
                        src={engine.icon}
                        alt={engine.name} 
                        sx={{ width: 20, height: 20 }}
                      />
                    </ListItemIcon>
                    <ListItemText>{engine.name}</ListItemText>
                  </MenuItem>
                ))}
              </Menu>
              
              <InputBase
                {...inputPropsRest}
                {...rest}
                inputRef={params.InputProps.ref}
                sx={{ ml: 1, flex: 1, fontSize: '1rem', color: 'white' }}
                placeholder="输入搜索内容"
                inputProps={{ 
                  ...params.inputProps,
                  'aria-label': 'search web',
                  style: { color: 'white' },
                  onKeyDown: (e) => {
                    if (params.inputProps.onKeyDown) {
                      // @ts-ignore: MUI type mismatch
                      params.inputProps.onKeyDown(e);
                    }
                    // Handle custom key down logic
                    handleKeyDown(e);
                  }
                }}
              />
              
              <IconButton 
                type="button" 
                sx={{ p: '8px', color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }} 
                aria-label="search"
                onClick={() => handleSearch(inputValue)}
              >
                <SearchIcon />
              </IconButton>
            </Paper>
          );
        }}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <li key={key} {...otherProps} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px' }}>
              {option.icon ? (
                <Box component="img" src={option.icon} alt="" sx={{ width: 24, height: 24, borderRadius: 1 }} />
              ) : (
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)', width: 24, height: 24 }} />
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" sx={{ color: 'white' }}>{option.name || option}</Typography>
                {option.url && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                    {option.url}
                  </Typography>
                )}
              </Box>
            </li>
          );
        }}
      />
    </Box>
  );
}
