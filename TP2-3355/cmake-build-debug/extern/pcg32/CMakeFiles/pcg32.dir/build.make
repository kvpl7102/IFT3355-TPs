# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 3.28

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:

#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:

# Disable VCS-based implicit rules.
% : %,v

# Disable VCS-based implicit rules.
% : RCS/%

# Disable VCS-based implicit rules.
% : RCS/%,v

# Disable VCS-based implicit rules.
% : SCCS/s.%

# Disable VCS-based implicit rules.
% : s.%

.SUFFIXES: .hpux_make_needs_suffix_list

# Command-line flag to silence nested $(MAKE).
$(VERBOSE)MAKESILENT = -s

#Suppress display of executed commands.
$(VERBOSE).SILENT:

# A target that is always out of date.
cmake_force:
.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /snap/cmake/1366/bin/cmake

# The command to remove a file.
RM = /snap/cmake/1366/bin/cmake -E rm -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/cmake-build-debug

# Include any dependencies generated for this target.
include extern/pcg32/CMakeFiles/pcg32.dir/depend.make
# Include any dependencies generated by the compiler for this target.
include extern/pcg32/CMakeFiles/pcg32.dir/compiler_depend.make

# Include the progress variables for this target.
include extern/pcg32/CMakeFiles/pcg32.dir/progress.make

# Include the compile flags for this target's objects.
include extern/pcg32/CMakeFiles/pcg32.dir/flags.make

# Object files for target pcg32
pcg32_OBJECTS =

# External object files for target pcg32
pcg32_EXTERNAL_OBJECTS =

extern/pcg32/libpcg32.a: extern/pcg32/CMakeFiles/pcg32.dir/build.make
extern/pcg32/libpcg32.a: extern/pcg32/CMakeFiles/pcg32.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green --bold --progress-dir=/mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/cmake-build-debug/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Linking CXX static library libpcg32.a"
	cd /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/cmake-build-debug/extern/pcg32 && $(CMAKE_COMMAND) -P CMakeFiles/pcg32.dir/cmake_clean_target.cmake
	cd /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/cmake-build-debug/extern/pcg32 && $(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/pcg32.dir/link.txt --verbose=$(VERBOSE)

# Rule to build all files generated by this target.
extern/pcg32/CMakeFiles/pcg32.dir/build: extern/pcg32/libpcg32.a
.PHONY : extern/pcg32/CMakeFiles/pcg32.dir/build

extern/pcg32/CMakeFiles/pcg32.dir/clean:
	cd /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/cmake-build-debug/extern/pcg32 && $(CMAKE_COMMAND) -P CMakeFiles/pcg32.dir/cmake_clean.cmake
.PHONY : extern/pcg32/CMakeFiles/pcg32.dir/clean

extern/pcg32/CMakeFiles/pcg32.dir/depend:
	cd /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/cmake-build-debug && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355 /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/extern/pcg32 /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/cmake-build-debug /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/cmake-build-debug/extern/pcg32 /mnt/e/UDEM/UDEM_H24/IFT3355/IFT3355-TPs/TP2-3355/cmake-build-debug/extern/pcg32/CMakeFiles/pcg32.dir/DependInfo.cmake "--color=$(COLOR)"
.PHONY : extern/pcg32/CMakeFiles/pcg32.dir/depend
